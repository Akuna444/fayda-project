'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2, Printer, Coins, Image as ImageIcon, X, User, QrCode, Hash, Shield, LogOut, Plus } from "lucide-react";
import axios from "axios";
import Barcode from "react-barcode";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import Image from "next/image";

interface UserPoints {
  points: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [customFrontTemplate, setCustomFrontTemplate] = useState<string | null>(null);
  const [customBackTemplate, setCustomBackTemplate] = useState<string | null>(null);
  const router = useRouter();
  const session = useSession()
  const user = session?.data?.user;

  const fetchUserPoints = async () => {
    try {
      setPointsLoading(true);
      const response = await fetch('/api/points', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setPointsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserPoints();
    }
  }, [user?.id]);

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'front') {
        setCustomFrontTemplate(result);
      } else {
        setCustomBackTemplate(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCustomTemplate = (type: 'front' | 'back') => {
    if (type === 'front') {
      setCustomFrontTemplate(null);
    } else {
      setCustomBackTemplate(null);
    }
  };

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    if (userPoints && userPoints.points < 1) {
      setError("Insufficient points. Please add more points to process PDF.");
      return;
    }
   
    setLoading(true)
    setError(null);
    setExtractedData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/api/process-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      if (response.data.success) {
        setExtractedData(response.data);
        fetchUserPoints()
      } else {
        setError("Failed to process the document: " + (response.data.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "Upload failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-blue-100/50">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
              Welcome back, <span className="text-lg lg:text-2xl text-blue-600">{user?.email}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              {userPoints && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200">
                  <Coins className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-700">{userPoints.points} points available</span>
                </div>
              )}
              {pointsLoading && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  <span className="text-slate-600">Loading points...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {user?.id === "A6uihg20B1gGIhrMp3Z7rwrLXCUEgfko" && (
              <Button 
                onClick={() => router.push("/add-points")}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Points
              </Button>
            )}
            <Button 
              onClick={() => signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/login");
                  },
                },
              })}
              variant="outline"
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-blue-100/50 backdrop-blur-sm bg-white/90">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Ethiopian ID Card Data Extractor
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Upload a PDF file to extract Ethiopian ID card information and generate ID cards
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
           

            {/* Upload Section */}
            <div className="space-y-6">
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="pdf-upload" className="text-slate-700 font-medium text-lg">
                    Select PDF File
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1 w-full">
                      <Input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          setFile(e.target.files ? e.target.files[0] : null);
                          setError(null);
                        }}
                        className="cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors py-6 text-slate-600"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={!file || loading}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Processing PDF...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-3 h-5 w-5" />
                          Extract Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Points Warning */}
              {userPoints && userPoints.points < 1 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-amber-800 font-medium">
                        Insufficient points
                      </p>
                      <p className="text-amber-700 text-sm mt-1">
                        Contact me for more points{' '}
                        <a href="https://t.me/NatiTG2" className="font-bold underline hover:text-amber-900" target="_blank">
                          Here
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}
            </div>

            

            {/* Preview Section */}
            {extractedData && (
              <GeneratedIDCardPreview 
                data={extractedData} 
                customFrontTemplate={customFrontTemplate}
                customBackTemplate={customBackTemplate}
              />
            )}

             {/* Custom Templates Section */}
            {extractedData && (
              <div className="space-y-6 p-6 border-2 border-dashed border-blue-200/50 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Custom Templates (Optional)
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="front-template" className="text-slate-700 font-medium">
                      Front Template
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          id="front-template"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleTemplateUpload(e, 'front')}
                          className="cursor-pointer border-blue-200 focus:border-blue-400 transition-colors"
                        />
                      </div>
                      {customFrontTemplate && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomTemplate('front')}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {customFrontTemplate && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Custom front template loaded successfully
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="back-template" className="text-slate-700 font-medium">
                      Back Template
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          id="back-template"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleTemplateUpload(e, 'back')}
                          className="cursor-pointer border-blue-200 focus:border-blue-400 transition-colors"
                        />
                      </div>
                      {customBackTemplate && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomTemplate('back')}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {customBackTemplate && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Custom back template loaded successfully
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface GeneratedIDCardPreviewProps {
  data: any;
  customFrontTemplate?: string | null;
  customBackTemplate?: string | null;
}

function GeneratedIDCardPreview({ data, customFrontTemplate, customBackTemplate }: GeneratedIDCardPreviewProps) {
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string>(data.images?.[0] || '');
  const [selectedMiniProfileImage, setSelectedMiniProfileImage] = useState<string>(data.images?.[0] || '');
  const [selectedQRCodeImage, setSelectedQRCodeImage] = useState<string>(data.images?.[2] || '');
  const [serialNumber, setSerialNumber] = useState<string>(generateRandomSerial());
  
  const defaultFrontImageUrl = '/front-template.jpg';
  const defaultBackImageUrl = '/back-template.jpg';
  
  const frontImageUrl = customFrontTemplate || defaultFrontImageUrl;
  const backImageUrl = customBackTemplate || defaultBackImageUrl;
  
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Generate random serial number
  function generateRandomSerial(): string {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  }

  // Get FCN ID for barcode
  const fcnId = data.fcn_id ? data.fcn_id.replace(/\s/g, '') : '4017497305237984';

  // Update selected images when data changes
  useEffect(() => {
    if (data.images && data.images.length > 0) {
      setSelectedProfileImage(data.images[0]);
      setSelectedMiniProfileImage(data.images[0]);
      if (data.images.length > 2) {
        setSelectedQRCodeImage(data.images[2]);
      }
    }
    setSerialNumber(generateRandomSerial());
  }, [data.images]);

  // Helper function to download blobs
  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Capture element using html2canvas with mirror effect
  const captureElementAsImage = async (element: HTMLElement): Promise<string> => {
    if (!element) return null;

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // Higher quality
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
        onclone: (clonedDoc, element) => {
          // Ensure all images are loaded
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            img.crossOrigin = 'anonymous';
          });
        }
      });

      // Apply mirror effect (horizontal flip)
      const mirroredCanvas = document.createElement('canvas');
      mirroredCanvas.width = canvas.width;
      mirroredCanvas.height = canvas.height;
      const ctx = mirroredCanvas.getContext('2d');
      
      // Flip horizontally for printing
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(canvas, 0, 0);
      
      return mirroredCanvas.toDataURL('image/png', 1.0);

    } catch (error) {
      console.error('Error capturing element:', error);
      throw error;
    }
  };

  // Download as PDF with mirrored cards only
  const downloadAsPDF = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    
    try {
      setDownloadLoading('pdf');
      
      console.log('Starting PDF download with mirror effect...');
      
      const [frontImage, backImage] = await Promise.all([
        captureElementAsImage(frontCardRef.current), // Mirrored front
        captureElementAsImage(backCardRef.current)   // Mirrored back
      ]);

      console.log('Mirrored images captured, creating PDF...');

      // Create PDF in landscape A4
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions for side-by-side layout
      const margin = 10;
      const availableWidth = pdfWidth - (2 * margin);
      const cardWidth = availableWidth / 2 - 5; // 5mm gap between cards
      const cardHeight = (cardWidth * 800) / 1280; // Maintain aspect ratio

      // Add mirrored front side (left)
      if (frontImage) {
        pdf.addImage(frontImage, 'PNG', margin, margin, cardWidth, cardHeight);
      }

      // Add mirrored back side (right)
      if (backImage) {
        pdf.addImage(backImage, 'PNG', margin + cardWidth + 5, margin, cardWidth, cardHeight);
      }

      pdf.save(`${data.english_name}-id-card.pdf`);
      console.log('PDF with mirrored cards downloaded successfully');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadLoading(null);
    }
  };

  // Download as ZIP with mirrored images only
  const downloadAsZIP = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    
    try {
      setDownloadLoading('zip');
      console.log('Starting ZIP download with mirrored images...');
      
      const [frontImage, backImage] = await Promise.all([
        captureElementAsImage(frontCardRef.current), // Mirrored front
        captureElementAsImage(backCardRef.current)   // Mirrored back
      ]);

      const zip = new JSZip();

      // Add mirrored images directly to zip (no folders, no labels)
      if (frontImage) {
        const frontBase64 = frontImage.split(',')[1];
        zip.file('ethiopian-id-front.png', frontBase64, { base64: true });
      }

      if (backImage) {
        const backBase64 = backImage.split(',')[1];
        zip.file('ethiopian-id-back.png', backBase64, { base64: true });
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'ethiopian-id-cards.zip');
      console.log('ZIP with mirrored images downloaded successfully');
      
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Failed to download ZIP. Please try again.');
    } finally {
      setDownloadLoading(null);
    }
  };

  const downloadOptions = [
    {
      label: 'Download PDF',
      icon: Download,
      onClick: downloadAsPDF,
      key: 'pdf'
    },
    {
      label: 'Download ZIP',
      icon: Download,
      onClick: downloadAsZIP,
      key: 'zip'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Preview Header */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-slate-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ID Card Preview
        </h3>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Review your generated ID card below. You can customize images and download in your preferred format.
        </p>
      </div>

      {/* Customization Panel */}
      {data.images && data.images.length > 0 && (
        <div className="space-y-6 p-6 border-2 border-dashed border-green-200 rounded-2xl bg-gradient-to-r from-green-50/50 to-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800">
              Customize ID Card
            </h4>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Profile Image Selector */}
            <div className="space-y-2">
              <Label htmlFor="profile-image-select" className="text-slate-700 font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Main Profile
              </Label>
              <select
                id="profile-image-select"
                value={selectedProfileImage}
                onChange={(e) => setSelectedProfileImage(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                {data.images.map((image: string, index: number) => (
                  <option key={index} value={image}>
                    {index === 0 ? 'Default Profile' : `Image ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Mini Profile Image Selector */}
            <div className="space-y-2">
              <Label htmlFor="mini-profile-select" className="text-slate-700 font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Mini Profile
              </Label>
              <select
                id="mini-profile-select"
                value={selectedMiniProfileImage}
                onChange={(e) => setSelectedMiniProfileImage(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                {data.images.map((image: string, index: number) => (
                  <option key={index} value={image}>
                    {index === 0 ? 'Default Profile' : `Image ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* QR Code Image Selector */}
            <div className="space-y-2">
              <Label htmlFor="qr-code-select" className="text-slate-700 font-medium flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </Label>
              <select
                id="qr-code-select"
                value={selectedQRCodeImage}
                onChange={(e) => setSelectedQRCodeImage(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                {data.images.map((image: string, index: number) => (
                  <option key={index} value={image}>
                    {index === 2 ? 'Default QR Code' : `Image ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Serial Number Control */}
            <div className="space-y-2">
              <Label htmlFor="serial-number" className="text-slate-700 font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Serial Number
              </Label>
              <div className="flex gap-2">
                <Input
                  id="serial-number"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="flex-1 border-slate-200 focus:border-blue-400"
                  placeholder="Enter serial number"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSerialNumber(generateRandomSerial())}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                >
                  Random
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Template Notice */}
      {(customFrontTemplate || customBackTemplate) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-blue-700 text-sm">
              Using custom template{customFrontTemplate && customBackTemplate ? 's' : ''}: 
              {customFrontTemplate && ' Front'}
              {customFrontTemplate && customBackTemplate && ' and'}
              {customBackTemplate && ' Back'}
            </p>
          </div>
        </div>
      )}
      
      {/* Preview Cards - Keeping original dimensions */}
      <div className="space-y-8">
        {/* Front Card */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Front Side</h4>
          <div 
            ref={frontCardRef}
            className="relative mx-auto border-2 border-gray-300 bg-cover bg-center bg-no-repeat"
            style={{ 
              height: '800px', 
              width: '1280px',
              backgroundImage: `url("${frontImageUrl}")`
            }}
          >
            {/* Profile Images */}
            {data.images && data.images.length > 0 && (
              <>
                <Image
                  width={440}
                  height={540}
                  src={`https://api.fayda.pro.et/${selectedProfileImage}`} 
                  alt="Profile" 
                  className="absolute"
                  style={{ 
                    top: '200px', 
                    left: '55px',
                    width: '440px',
                    height: '540px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <Image
                  width={100}
                  height={130}
                  src={`https://api.fayda.pro.et/${selectedMiniProfileImage}`} 
                  alt="Profile" 
                  className="absolute"
                  style={{ 
                    bottom: '70px', 
                    right: '150px',
                    width: '100px',
                    height: '130px',
                    objectFit: 'fill',
                    borderRadius: '4px'
                  }}
                />
              </>
            )}

            {/* Dynamic Barcode */}
            <div className="absolute" style={{ top: '620px', left: '570px' }}>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '10px', 
                borderRadius: '4px',
                display: 'inline-block',
                position: 'relative',
                zIndex: 10
              }}>
                {/* FCN ID Text - More explicit styling */}
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '24px',
                  letterSpacing: '5px',
                  textAlign: 'center',
                  marginBottom: '5px',
                  color: '#000000', // Explicit black color
                  fontFamily: 'Arial, sans-serif', // Explicit font family
                  lineHeight: '1.2',
                  background: 'white',
                  padding: '2px 5px',
                  borderRadius: '2px',
                  zIndex: 100,
                  position: 'relative'
                }}>
                  {data.fcn_id || '4017 4973 0523 7984'}
                </div>
                
                {/* Barcode with explicit styling */}
                <div style={{
                  background: 'white',
                  padding: '5px',
                  borderRadius: '2px'
                }}>
                  <Barcode
                    value={fcnId}
                    width={2.6}
                    height={50}
                    fontSize={16}
                    format="CODE128"
                    displayValue={false}
                    background="white"
                    lineColor="#000000" // Explicit black
                    margin={10}
                  />
                </div>
              </div>
            </div>

            {/* Full Name Data */}
            <div className="absolute" style={{ top: '210px', left: '512px' }}>
              <div className="amharic-text text-[30px] font-bold text-black">{data.amharic_name || 'የኃለሽት አየለ ጉብረሖት'}</div>
              <div className="english-text text-[30px] font-bold text-black">{data.english_name || 'Yehualeshet Ayele Gebrehot'}</div>
            </div>

            {/* Date of Birth Data */}
            <div className="absolute" style={{ top: '380px', left: '510px' }}>
              <div className="amharic-text text-[30px] font-bold text-black">
                {data.birth_date_ethiopian || '11/06/1991'} | {data.birth_date_gregorian || '1999/Feb/18'}
              </div>
            </div>

            {/* Sex Data */}
            <div className="absolute" style={{ top: '457px', left: '514px' }}>
              <div className="amharic-text text-[30px] font-bold text-black">
                {data.amharic_gender || 'ሴት'} | {data.english_gender || 'Female'}
              </div>
            </div>

            {/* Date of Issue Data */}
            <div className="absolute" style={{ top: '560px', left: '27px' }}>
              <div className="amharic-text rotate-270 text-[30px] font-bold text-black transform  origin-left">
                {data.issue_date_ethiopian || '2018/03/08'}
              </div>
            </div>

            <div className="absolute" style={{ top: '200px', left: '27px' }}>
              <div className="english-text rotate-270 text-[30px] font-bold text-black transform  origin-left">
                {data.issue_date_gregorian || '2025/Nov/17'}
              </div>
            </div>

            {/* Date of Expiry Data */}
            <div className="absolute" style={{ top: '545px', left: '515px' }}>
              <div className="amharic-text text-[30px] font-bold text-black">
                {data.expiry_date_ethiopian || '2026/03/08'} | {data.expiry_date_gregorian || '2033/Nov/17'}
              </div>
            </div>
          </div>
        </div>

        {/* Back Card */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Back Side</h4>
          <div 
            ref={backCardRef}
            className="relative mx-auto border-2 border-gray-300 bg-cover bg-center bg-no-repeat"
            style={{ 
              height: '800px', 
              width: '1280px',
              backgroundImage: `url("${backImageUrl}")`
            }}
          >
            {/* Phone Number Data */}
            <div 
              className="english-text absolute"
              style={{ 
                margin: '0px',
                fontWeight: "bold",
                fontSize: '32px',
                lineHeight: '1.15',
                letterSpacing: '0.5px',
                color: 'rgb(0, 0, 0)',
                top: '93px',
                left: '41px'
              }}>
              {data.phone_number || '0984124132'}
            </div>

            {/* Address Data */}
            <div className="text-black font-bold absolute" style={{ left: '44px', top: '290px' }}>
              <div className="amharic-text" style={{ fontSize: '30px', marginBottom: '-5px' }}>
                {data.amharic_city || 'አማራ'}
              </div>
              <div className="english-text margin_bottom" style={{ fontSize: '30px', marginBottom: '20px' }}>
                {data.english_city || 'Amhara'}
              </div>
              <div className="amharic-text" style={{ fontSize: '30px', marginBottom: '-5px' }}>
                {data.amharic_sub_city || 'ባህር ዳር ልዩ ዞን'}
              </div>
              <div className="english-text margin_bottom" style={{ fontSize: '30px', marginBottom: '20px' }}>
                {data.english_sub_city || 'Bahir Dar Special Zone'}
              </div>
              <div className="amharic-text" style={{ fontSize: '30px', marginBottom: '-5px' }}>
                {data.amharic_woreda || 'ዳግማዊ ሚኒሊክ'}
              </div>
              <div className="english-text margin_bottom" style={{ fontSize: '30px', marginBottom: '20px' }}>
                {data.english_woreda || 'Dagmawi Minilik'}
              </div>
            </div>

            {/* FIN Number */}
            <div className="absolute" style={{ 
              fontWeight: 700,
              fontSize: '30px',
              lineHeight: '10px',
              letterSpacing: '0px',
              color: 'rgb(0, 0, 0)',
              bottom: '113px',
              left: '171px'
            }}>
              {data.fin_number || '6725-6073-1762'}
            </div>

            {/* Additional Number */}
            <div style={{ 
              fontWeight: "bold",
              fontSize: '28px',
              lineHeight: '1.6',
              letterSpacing: '2px',
              color: 'rgb(0, 0, 0)',
              position: 'absolute',
              left: '1070px',
              bottom: '27px'
            }}>
              {serialNumber}
            </div>

            {/* QR Code */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: '40px',
              right: '38px',
              width: '666px',
              height: '650px',
              backgroundColor: 'rgb(255, 255, 255)'
            }}>
              {data.images && data.images.length > 0 && (
                <Image
                  width={690}
                  height={690}
                  src={`https://api.fayda.pro.et/${selectedQRCodeImage}`} 
                  alt="QR Code" 
                  style={{ 
                    width: '690px',
                    height: '690px',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 border-t border-slate-200">
        <p className="text-slate-600 font-medium text-lg">Download your ID card:</p>
        <div className="flex gap-3 flex-wrap justify-center">
          {downloadOptions.map((option) => (
            <Button
              key={option.key}
              onClick={option.onClick}
              disabled={!!downloadLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadLoading === option.key ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <option.icon className="mr-2 h-5 w-5" />
              )}
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}