"use client";

import { useState } from "react";
import { DateRangePicker } from "@/components/ui/date-picker";

export default function TestDatePickerPage() {
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Enhanced DateRangePicker Test
                </h1>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        DateRangePicker with Year Dropdown
                    </h2>
                    
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            This test page demonstrates the enhanced DateRangePicker component with year dropdown functionality.
                            The calendar should show dropdown menus for both month and year selection.
                        </p>
                        
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateSelect={setStartDate}
                            onEndDateSelect={setEndDate}
                            startPlaceholder="Select start date"
                            endPlaceholder="Select end date"
                        />
                        
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                Selected Dates:
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Start Date: {startDate ? startDate.toLocaleDateString() : 'Not selected'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                End Date: {endDate ? endDate.toLocaleDateString() : 'Not selected'}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                        Testing Instructions:
                    </h3>
                    <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                        <li>• Click on either date picker button to open the calendar</li>
                        <li>• Verify that dropdown menus appear for month and year selection</li>
                        <li>• Test that you can quickly jump to different years using the year dropdown</li>
                        <li>• Ensure the year range shows approximately current year ± 10 years</li>
                        <li>• Confirm that date selection works properly for both start and end dates</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
