<?php

namespace App\Services;

use App\Models\Customer;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;

class CustomerImportService
{
    public function importFromExcel($file, $type)
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
                    if ($type === 'student') {
                        // Expected columns for students: ID, NAME (full name), GRADE/YEAR LEVEL, COURSE/STRAND, TYPE
                        $studentId = $row[0] ?? null;
                        $fullName = trim($row[1] ?? '');
                        $yearLevel = $row[2] ?? null;
                        $course = $row[3] ?? null;
                        $rowType = strtolower($row[4] ?? 'student');
                        
                        // Split full name into first and last name
                        $nameParts = explode(' ', $fullName, 2);
                        $firstName = $nameParts[0] ?? '';
                        $lastName = $nameParts[1] ?? '';
                    } else {
                        // Expected columns for teachers: ID, NAME (full name), DEPARTMENT, TYPE
                        $studentId = $row[0] ?? null;
                        $fullName = trim($row[1] ?? '');
                        $department = $row[2] ?? null;
                        $rowType = strtolower($row[3] ?? 'teacher');
                        
                        // Split full name into first and last name
                        $nameParts = explode(' ', $fullName, 2);
                        $firstName = $nameParts[0] ?? '';
                        $lastName = $nameParts[1] ?? '';
                        $yearLevel = null;
                        $course = null;
                    }

                    if (empty($fullName)) {
                        $errors[] = "Row " . ($index + 2) . ": Missing name";
                        continue;
                    }
                    
                    // If no last name after splitting, use the full name as first name
                    if (empty($lastName)) {
                        $lastName = $firstName;
                    }

                    // Ensure type matches
                    $finalType = ($type === 'student') ? 'student' : 'teacher';

                    // Check if customer exists
                    $customer = Customer::where('student_id', $studentId)
                        ->where('type', $finalType)
                        ->first();

                    $customerData = [
                        'student_id' => $studentId,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'type' => $finalType,
                    ];

                    if ($type === 'student') {
                        $customerData['year_level'] = $yearLevel;
                        $customerData['course'] = $course;
                    } else {
                        $customerData['department'] = $department;
                    }

                    if ($customer) {
                        // Update existing
                        $customer->update($customerData);
                    } else {
                        // Create new
                        Customer::create($customerData);
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

