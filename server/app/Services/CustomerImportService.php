<?php

namespace App\Services;

use App\Models\Customer;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;

class CustomerImportService
{
    public function importFromExcel($file)
    {
        $data = Excel::toArray([], $file);
        
        if (empty($data) || empty($data[0])) {
            throw new \Exception('Excel file is empty or invalid');
        }

        $rows = $data[0];
        $header = array_shift($rows); // Remove header row

        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                try {
                    // Map columns (adjust based on your Excel structure)
                    // Expected: Student ID, First Name, Last Name, Course, Phone, Type
                    $studentId = $row[0] ?? null;
                    $firstName = $row[1] ?? '';
                    $lastName = $row[2] ?? '';
                    $course = $row[3] ?? null;
                    $phone = $row[4] ?? null;
                    $type = strtolower($row[5] ?? 'student');

                    if (empty($firstName) || empty($lastName)) {
                        $errors[] = "Row " . ($index + 2) . ": Missing first name or last name";
                        continue;
                    }

                    // Check if customer exists
                    $customer = Customer::where('student_id', $studentId)->first();

                    if ($customer) {
                        // Update existing
                        $customer->update([
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'course' => $course,
                            'phone' => $phone,
                            'type' => in_array($type, ['student', 'teacher']) ? $type : 'student',
                        ]);
                    } else {
                        // Create new
                        Customer::create([
                            'student_id' => $studentId,
                            'first_name' => $firstName,
                            'last_name' => $lastName,
                            'course' => $course,
                            'phone' => $phone,
                            'type' => in_array($type, ['student', 'teacher']) ? $type : 'student',
                        ]);
                    }

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
                }
            }

            DB::commit();

            return [
                'imported' => $imported,
                'errors' => $errors,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

