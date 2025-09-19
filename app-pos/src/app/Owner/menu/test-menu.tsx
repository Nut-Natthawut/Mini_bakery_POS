"use client";

import { useState } from 'react';
import { createMenu, getMenus, updateMenu, deleteMenu } from '../../../actions/menu';
import { toast } from "sonner";

const TestMenu = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCreateMenu = async () => {
    setIsLoading(true);
    try {
      // สร้างไฟล์รูปภาพ mock
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await createMenu({
        menuName: 'Test Menu',
        price: 100,
        menuDetail: 'Test menu description',
        imageFile: mockFile
      });

      if (result.success) {
        addResult('✅ Create Menu: สำเร็จ');
        return result.data?.menuID;
      } else {
        addResult(`❌ Create Menu: ${result.error}`);
        return null;
      }
    } catch (error: any) {
      addResult(`❌ Create Menu Error: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testGetMenus = async () => {
    setIsLoading(true);
    try {
      const result = await getMenus();
      
      if (result.success) {
        addResult(`✅ Get Menus: สำเร็จ (${result.data?.length || 0} รายการ)`);
        return result.data;
      } else {
        addResult(`❌ Get Menus: ${result.error}`);
        return null;
      }
    } catch (error: any) {
      addResult(`❌ Get Menus Error: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testUpdateMenu = async (menuID: string) => {
    setIsLoading(true);
    try {
      const result = await updateMenu(menuID, {
        menuName: 'Updated Test Menu',
        price: 150,
        menuDetail: 'Updated description',
        imageFile: null
      });

      if (result.success) {
        addResult('✅ Update Menu: สำเร็จ');
      } else {
        addResult(`❌ Update Menu: ${result.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Update Menu Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteMenu = async (menuID: string) => {
    setIsLoading(true);
    try {
      const result = await deleteMenu(menuID);
      
      if (result.success) {
        addResult('✅ Delete Menu: สำเร็จ');
      } else {
        addResult(`❌ Delete Menu: ${result.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Delete Menu Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 เริ่มทดสอบ CRUD Operations...');
    
    // Test 1: Create
    const createdMenuID = await testCreateMenu();
    
    // Test 2: Read
    await testGetMenus();
    
    // Test 3: Update
    if (createdMenuID) {
      await testUpdateMenu(createdMenuID);
    }
    
    // Test 4: Delete
    if (createdMenuID) {
      await testDeleteMenu(createdMenuID);
    }
    
    addResult('🏁 การทดสอบเสร็จสิ้น');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ทดสอบ CRUD Menu Operations</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'กำลังทดสอบ...' : 'ทดสอบทั้งหมด'}
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={testCreateMenu}
            disabled={isLoading}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            ทดสอบ Create
          </button>
          <button
            onClick={testGetMenus}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            ทดสอบ Read
          </button>
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">ผลการทดสอบ:</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500">ยังไม่มีการทดสอบ</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestMenu;
