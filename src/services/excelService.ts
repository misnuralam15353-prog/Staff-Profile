import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Employee } from '../types';

export const excelService = {
  async exportToExcel(employees: Employee[], fileName: string = 'Employee_Records.xlsx') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Employees');

      // Define columns
      worksheet.columns = [
        { header: 'Photo', key: 'photo', width: 12 },
        { header: 'Staff ID', key: 'employeeId', width: 15 },
        { header: 'Full Name', key: 'name', width: 25 },
        { header: 'Designation', key: 'designation', width: 20 },
        { header: 'Salary (BDT)', key: 'salary', width: 15 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Joining Date', key: 'joiningDate', width: 15 },
        { header: 'NID Number', key: 'nid', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Guardian 1 Name', key: 'g1name', width: 20 },
        { header: 'Guardian 1 Relation', key: 'g1relation', width: 15 },
        { header: 'Guardian 1 Phone', key: 'g1phone', width: 15 },
        { header: 'Guardian 2 Name', key: 'g2name', width: 20 },
        { header: 'Guardian 2 Relation', key: 'g2relation', width: 15 },
        { header: 'Guardian 2 Phone', key: 'g2phone', width: 15 },
        { header: 'Present Address', key: 'presentAddress', width: 30 },
        { header: 'Permanent Address', key: 'permanentAddress', width: 30 },
        { header: 'From Address', key: 'fromAddress', width: 25 },
        { header: 'Departure Address', key: 'departureAddress', width: 25 },
      ];

      // Add rows
      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        
        const row = worksheet.addRow({
          employeeId: emp.employeeId,
          name: emp.name,
          designation: emp.designation,
          salary: emp.salary,
          phone: emp.phone,
          joiningDate: emp.joiningDate,
          nid: emp.nid,
          status: emp.status,
          g1name: emp.guardian1.name,
          g1relation: emp.guardian1.relation,
          g1phone: emp.guardian1.phone,
          g2name: emp.guardian2.name,
          g2relation: emp.guardian2.relation,
          g2phone: emp.guardian2.phone,
          presentAddress: emp.presentAddress,
          permanentAddress: emp.permanentAddress,
          fromAddress: emp.fromAddress || emp.leaveStartDate || '',
          departureAddress: emp.departureAddress || emp.leaveEndDate || '',
        });

        // Set row height to accommodate image
        row.height = 60;

        // Process image if exists
        if (emp.photoUrl && emp.photoUrl.startsWith('data:image')) {
          try {
            const base64Content = emp.photoUrl.split(';base64,').pop();
            if (base64Content) {
              const imageId = workbook.addImage({
                base64: base64Content,
                extension: 'jpeg',
              });

              worksheet.addImage(imageId, {
                tl: { col: 0, row: i + 1 },
                ext: { width: 70, height: 70 },
                editAs: 'oneCell'
              });
            }
          } catch (imgError) {
            console.error('Failed to add image to excel for', emp.employeeId, imgError);
          }
        }
      }

      // Styling headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Excel Export Error:', error);
      throw error;
    }
  },

  downloadSample() {
    const sample = [{
      'Staff ID': 'RFL001',
      'Full Name': 'John Doe',
      'Designation': 'Senior Developer',
      'Salary (BDT)': 50000,
      'Phone': '01XXXXXXXXX',
      'Joining Date': '2022-01-01',
      'NID Number': '1234567890123',
      'Present Address': 'Dhaka, Bangladesh',
      'Permanent Address': 'Village, District',
      'Status': 'active',
      'Guardian 1 Name': 'Guardian Alpha',
      'Guardian 1 Relation': 'Father',
      'Guardian 1 Phone': '01XXXXXXXXX',
      'Guardian 2 Name': 'Guardian Beta',
      'Guardian 2 Relation': 'Mother',
      'Guardian 2 Phone': '01XXXXXXXXX',
      'From Address': 'Dhaka Head Office',
      'Departure Address': 'Chattogram Plant',
      'Photo URL': 'https://api.dicebear.com/7.x/avataaars/svg?seed=sample'
    }];

    const worksheet = XLSX.utils.json_to_sheet(sample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, 'RFL_Employee_Template.xlsx');
  },

  async importFromExcel(file: File): Promise<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];

        const employees = json.map(row => {
          const fromAddr = String(row['From Address'] || row['Leave Start'] || '');
          const depAddr = String(row['Departure Address'] || row['Leave End'] || '');
          return {
            employeeId: String(row['Staff ID'] || ''),
            name: String(row['Full Name'] || ''),
            designation: String(row['Designation'] || 'Other'),
            salary: Number(row['Salary (BDT)'] || 0),
            phone: String(row['Phone'] || ''),
            joiningDate: String(row['Joining Date'] || ''),
            nid: String(row['NID Number'] || ''),
            presentAddress: String(row['Present Address'] || ''),
            permanentAddress: String(row['Permanent Address'] || ''),
            status: (row['Status'] || 'active') as any,
            guardian1: {
              name: String(row['Guardian 1 Name'] || row['G1 Name'] || ''),
              relation: String(row['Guardian 1 Relation'] || row['G1 Relation'] || ''),
              phone: String(row['Guardian 1 Phone'] || row['G1 Phone'] || '')
            },
            guardian2: {
              name: String(row['Guardian 2 Name'] || row['G2 Name'] || ''),
              relation: String(row['Guardian 2 Relation'] || row['G2 Relation'] || ''),
              phone: String(row['Guardian 2 Phone'] || row['G2 Phone'] || '')
            },
            fromAddress: fromAddr,
            departureAddress: depAddr,
            leaveStartDate: fromAddr,
            leaveEndDate: depAddr,
            photoUrl: String(row['Photo URL'] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`),
          };
        });

        resolve(employees);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
};
