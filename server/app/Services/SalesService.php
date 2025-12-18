<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class SalesService
{
    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Calculate totals
            $subtotal = 0;
            $items = [];

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $itemSubtotal = $product->price * $item['quantity'];
                $subtotal += $itemSubtotal;

                // Check stock availability
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}. Available: {$product->stock}");
                }

                $items[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $taxRate = $data['tax_rate'] ?? 8.25;
            $taxAmount = ($subtotal * $taxRate) / 100;
            $total = $subtotal + $taxAmount;

            // Determine payment method and status
            $paymentMethod = $data['payment_method'] ?? 'cash';

            // Credit sales are initially unpaid (pending), cash sales are completed
            $status = $paymentMethod === 'credit' ? 'pending' : 'completed';

            // Create order
            $order = Order::create([
                'customer_id' => $data['customer_id'] ?? null,
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'cash_tendered' => $data['cash_tendered'] ?? null,
                'change_due' => $data['change_due'] ?? null,
                'payment_method' => $paymentMethod,
                'status' => $status,
            ]);

            // Create order items and update stock
            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Deduct stock
                $item['product']->stock -= $item['quantity'];
                $item['product']->save();
            }

            return $order->load(['customer', 'items.product']);
        });
    }
}

