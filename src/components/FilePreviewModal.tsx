import React, { useState, useEffect, useContext } from 'react';
import { FiX, FiDownload, FiFileText, FiGrid, FiImage, FiFile } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: 'spreadsheet' | 'document' | 'image' | 'pdf';
}

interface SheetData {
  name: string;
  data: any[][];
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    if (isOpen && fileUrl) {
      loadFilePreview();
    }
  }, [isOpen, fileUrl, fileType]);

  const loadFilePreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Validate file size
      if (arrayBuffer.byteLength === 0) {
        throw new Error('File is empty');
      }
      
      // Validate file size (max 50MB)
      if (arrayBuffer.byteLength > 50 * 1024 * 1024) {
        throw new Error('File is too large to preview');
      }
      
      if (fileType === 'spreadsheet') {
        await parseExcelFile(arrayBuffer);
      } else if (fileType === 'document') {
        await parseDocFile(arrayBuffer);
      } else if (fileType === 'pdf') {
        // For PDFs, we'll display them using an iframe
        setPreviewData(null);
      } else if (fileType === 'image') {
        // For images, we don't need to parse the arrayBuffer
        // The image will be displayed directly using the fileUrl
        setPreviewData(null);
      }
    } catch (err) {
      console.error('Error loading file preview:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file preview';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const parseExcelFile = async (arrayBuffer: ArrayBuffer) => {
    try {
      // Check for Excel file signatures
      const uint8Array = new Uint8Array(arrayBuffer);
      const isXLSX = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B; // ZIP signature (XLSX)
      const isXLS = uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF; // OLE signature (XLS)
      
      if (!isXLSX && !isXLS) {
        throw new Error('File does not appear to be a valid Excel file');
      }
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in the Excel file');
      }
      
      const sheets: SheetData[] = [];
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        if (worksheet) {
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          sheets.push({
            name: sheetName,
            data: jsonData as any[][]
          });
        }
      });
      
      if (sheets.length === 0) {
        throw new Error('No valid data found in the Excel file');
      }
      
      setPreviewData(sheets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Failed to parse Excel file: ${errorMessage}`);
    }
  };

  const parseDocFile = async (arrayBuffer: ArrayBuffer) => {
    try {
      // Check if the arrayBuffer is valid
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Invalid or empty file');
      }
      
      // Check for DOCX file signature (ZIP-based)
      const uint8Array = new Uint8Array(arrayBuffer);
      const isZipBased = uint8Array[0] === 0x50 && uint8Array[1] === 0x4B;
      
      if (!isZipBased) {
        throw new Error('File does not appear to be a valid DOCX file (not ZIP-based)');
      }
      
      // Additional check for minimum file size (DOCX files are typically larger than a few KB)
      if (arrayBuffer.byteLength < 1000) {
        throw new Error('File is too small to be a valid DOCX document');
      }
      
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      // Check if conversion was successful
      if (!result || typeof result.value !== 'string') {
        throw new Error('Document conversion failed - no content returned');
      }
      
      // Check if the result contains meaningful content
      if (result.value.trim().length === 0) {
        throw new Error('Document appears to be empty or contains no readable content');
      }
      
      setPreviewData(result.value);
    } catch (err) {
      console.error('Document parsing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('Can\'t find end of central directory')) {
        throw new Error('File is corrupted or not a valid DOCX document');
      } else if (errorMessage.includes('Could not find the body element')) {
        throw new Error('Document structure is invalid or corrupted');
      } else {
        throw new Error(`Failed to parse document file: ${errorMessage}`);
      }
    }
  };

  const renderExcelPreview = () => {
    if (!previewData || !Array.isArray(previewData)) return null;
    
    const currentSheet = previewData[activeSheet];
    if (!currentSheet || !currentSheet.data) return null;
    
    return (
      <div className="flex flex-col h-full">
        {/* Sheet tabs */}
        {previewData.length > 1 && (
          <div className={`flex border-b ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          } mb-4`}>
            {previewData.map((sheet: SheetData, index: number) => (
              <button
                key={index}
                onClick={() => setActiveSheet(index)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSheet === index
                    ? (darkMode ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600')
                    : (darkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-600 hover:text-gray-800')
                }`}
              >
                {sheet.name}
              </button>
            ))}
          </div>
        )}
        
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className={`min-w-full border-collapse ${
            darkMode ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <tbody>
              {currentSheet.data.slice(0, 100).map((row: any[], rowIndex: number) => (
                <tr key={rowIndex} className={rowIndex === 0 ? 
                  (darkMode ? 'bg-gray-700' : 'bg-gray-100') : 
                  (darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                }>
                  {row.map((cell: any, cellIndex: number) => (
                    <td
                      key={cellIndex}
                      className={`px-3 py-2 text-sm border ${
                        darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                      } ${rowIndex === 0 ? 'font-semibold' : ''}`}
                    >
                      {String(cell || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {currentSheet.data.length > 100 && (
            <div className={`p-4 text-center text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Showing first 100 rows of {currentSheet.data.length} total rows
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDocPreview = () => {
    if (!previewData || typeof previewData !== 'string') return null;
    
    return (
      <div className="h-full overflow-auto">
        <div className={`prose max-w-none ${
            darkMode ? 'text-gray-300 prose-invert' : 'text-gray-700'
          }`}
          dangerouslySetInnerHTML={{ __html: previewData }}
        />
      </div>
    );
  };

  const renderImagePreview = () => {
    return (
      <div className="h-full flex items-center justify-center overflow-auto">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: '100%', maxWidth: '100%' }}
        />
      </div>
    );
  };

  const renderPdfPreview = () => {
    return (
      <div className="h-full w-full">
        <iframe
          src={fileUrl}
          title={fileName}
          className="w-full h-full border-0"
          style={{ minHeight: '500px' }}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`relative w-full max-w-6xl h-5/6 rounded-lg shadow-xl ${
        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
      } border flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          darkMode ? 'border-gray-600' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {fileType === 'spreadsheet' ? (
              <FiGrid className={`text-xl ${
                darkMode ? 'text-green-400' : 'text-green-500'
              }`} />
            ) : fileType === 'document' ? (
              <FiFileText className={`text-xl ${
                darkMode ? 'text-blue-400' : 'text-blue-500'
              }`} />
            ) : fileType === 'pdf' ? (
              <FiFile className={`text-xl ${
                darkMode ? 'text-red-400' : 'text-red-500'
              }`} />
            ) : (
              <FiImage className={`text-xl ${
                darkMode ? 'text-purple-400' : 'text-purple-500'
              }`} />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {fileName}
              </h3>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {fileType === 'spreadsheet' ? 'Excel Spreadsheet' : 
                 fileType === 'document' ? 'Word Document' : 
                 fileType === 'pdf' ? 'PDF Document' : 'Image'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href={fileUrl}
              download={fileName}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                darkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <FiDownload size={16} />
              <span className="text-sm">Download</span>
            </a>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
              }`}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className={`text-center ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
                <p>Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className={`text-center ${
                darkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                <p className="mb-2">⚠️ {error}</p>
                <button
                  onClick={loadFilePreview}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full">
              {fileType === 'spreadsheet' ? renderExcelPreview() : 
               fileType === 'document' ? renderDocPreview() : 
               fileType === 'pdf' ? renderPdfPreview() : renderImagePreview()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;