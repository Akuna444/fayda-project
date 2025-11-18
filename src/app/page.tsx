'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2, Printer, Coins, Image as ImageIcon, X } from "lucide-react";
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="w-full gap-5 mb-5 items-center flex">
        <h1 className="">Welcome, <span className="font-bold">{user?.email}</span> </h1>
        {userPoints && (
          <div className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{userPoints.points} points available</span>
          </div>
        )}
        {pointsLoading && (
          <div className="flex items-center gap-2 mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading points...</span>
          </div>
        )}
        <button className="font-bold underline cursor-pointer" onClick={() => signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/login");
            },
          },
        })}>Logout</button>
        {user?.id === "A6uihg20B1gGIhrMp3Z7rwrLXCUEgfko" && <button className="cursor-pointer" onClick={() => router.push("/add-points")}>Add points</button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Ethiopian ID Card Data Extractor
          </CardTitle>
          <CardDescription>
            Upload a PDF file to extract Ethiopian ID card information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {extractedData && (<div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Custom Templates (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="front-template">Front Template</Label>
                <div className="flex gap-2">
                  <Input
                    id="front-template"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTemplateUpload(e, 'front')}
                    className="cursor-pointer"
                  />
                  {customFrontTemplate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomTemplate('front')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {customFrontTemplate && (
                  <div className="text-sm text-green-600">Custom front template loaded</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="back-template">Back Template</Label>
                <div className="flex gap-2">
                  <Input
                    id="back-template"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTemplateUpload(e, 'back')}
                    className="cursor-pointer"
                  />
                  {customBackTemplate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomTemplate('back')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {customBackTemplate && (
                  <div className="text-sm text-green-600">Custom back template loaded</div>
                )}
              </div>
            </div>
          </div>)}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setFile(e.target.files ? e.target.files[0] : null);
                  setError(null);
                }}
                className="cursor-pointer"
              />
            </div>

            <Button
              type="submit"
              disabled={!file || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          </form>

          {userPoints && userPoints.points < 1 && <div>You have Insufficient points contact me to for more points <a href="https://t.me/NatiTG2" className="font-bold underline" target="_blank" >Here</a></div>}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {extractedData && (
            <GeneratedIDCardPreview 
              data={extractedData} 
              customFrontTemplate={customFrontTemplate}
              customBackTemplate={customBackTemplate}
            />
          )}
        </CardContent>
      </Card>
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
  
  const defaultFrontImageUrl = '/front-template.jpg';
  const defaultBackImageUrl = '/back-template.jpg';
  
  const frontImageUrl = customFrontTemplate || defaultFrontImageUrl;
  const backImageUrl = customBackTemplate || defaultBackImageUrl;
  
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Get FCN ID for barcode
  const fcnId = data.fcn_id ? data.fcn_id.replace(/\s/g, '') : '4017497305237984';

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

  // Capture element using html2canvas
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

      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('Error capturing element:', error);
      throw error;
    }
  };

  // Download as PDF
  const downloadAsPDF = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    
    try {
      setDownloadLoading('pdf');
      
      console.log('Starting PDF download...');
      
      const [frontImage, backImage] = await Promise.all([
        captureElementAsImage(frontCardRef.current),
        captureElementAsImage(backCardRef.current)
      ]);

      console.log('Images captured, creating PDF...');

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

      // Add front side
      if (frontImage) {
        pdf.addImage(frontImage, 'PNG', margin, margin, cardWidth, cardHeight);
      }

      // Add back side
      if (backImage) {
        pdf.addImage(backImage, 'PNG', margin + cardWidth + 5, margin, cardWidth, cardHeight);
      }

      pdf.save(`${data.english_name}-id-card.pdf`);
      console.log('PDF downloaded successfully');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadLoading(null);
    }
  };

  // Download as ZIP
  const downloadAsZIP = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    
    try {
      setDownloadLoading('zip');
      console.log('Starting ZIP download...');
      
      const [frontImage, backImage] = await Promise.all([
        captureElementAsImage(frontCardRef.current),
        captureElementAsImage(backCardRef.current)
      ]);

      const zip = new JSZip();

      // Add front image to ZIP
      if (frontImage) {
        const frontBase64 = frontImage.split(',')[1];
        zip.file('ethiopian-id-front.png', frontBase64, { base64: true });
      }

      // Add back image to ZIP
      if (backImage) {
        const backBase64 = backImage.split(',')[1];
        zip.file('ethiopian-id-back.png', backBase64, { base64: true });
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'ethiopian-id-cards.zip');
      console.log('ZIP downloaded successfully');
      
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Failed to download ZIP. Please try again.');
    } finally {
      setDownloadLoading(null);
    }
  };

  // Download as single A4 image
  const downloadAsA4Image = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;
    
    try {
      setDownloadLoading('image');
      console.log('Starting A4 image download...');

      // Create a container for both cards
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.gap = '20px';
      container.style.padding = '40px';
      container.style.backgroundColor = 'white';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      
      // Clone and resize cards
      const frontClone = frontCardRef.current.cloneNode(true) as HTMLDivElement;
      const backClone = backCardRef.current.cloneNode(true) as HTMLDivElement;
      
      // Set smaller dimensions for A4
      frontClone.style.width = '500px';
      frontClone.style.height = '312px'; // 500 * (800/1280)
      frontClone.style.transform = 'none';
      frontClone.style.position = 'relative';
      
      backClone.style.width = '500px';
      backClone.style.height = '312px';
      backClone.style.transform = 'none';
      backClone.style.position = 'relative';

      container.appendChild(frontClone);
      container.appendChild(backClone);

      document.body.appendChild(container);

      // Capture the container
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#ffffff',
        width: container.scrollWidth,
        height: container.scrollHeight,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);

      // Clean up
      document.body.removeChild(container);

      // Download the image
      downloadBlob(dataUrlToBlob(dataUrl), 'ethiopian-id-card-a4.png');
      console.log('A4 image downloaded successfully');

    } catch (error) {
      console.error('Error creating A4 image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setDownloadLoading(null);
    }
  };

  // Helper to convert data URL to blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  };

  const downloadOptions = [
    {
      label: 'Download PDF',
      icon: Download,
      onClick: downloadAsPDF,
      key: 'pdf'
    },
    // {
    //   label: 'Download Image (A4)',
    //   icon: ImageIcon,
    //   onClick: downloadAsA4Image,
    //   key: 'image'
    // },
    {
      label: 'Download ZIP',
      icon: Download,
      onClick: downloadAsZIP,
      key: 'zip'
    }
  ];

  return (
    <div className="space-y-8">
      <h3 className="text-[30px] font-semibold">Preview of ID Card</h3>
      
      {(customFrontTemplate || customBackTemplate) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            Using custom template{customFrontTemplate && customBackTemplate ? 's' : ''}: 
            {customFrontTemplate && ' Front'}
            {customFrontTemplate && customBackTemplate && ' and'}
            {customBackTemplate && ' Back'}
          </p>
        </div>
      )}
      
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
                src={`https://api.fayda.pro.et/${data.images[0]}`} 
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
                src={`https://api.fayda.pro.et/${data.images[0]}`} 
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
            2194581
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
            {data.images && data.images.length > 1 && (
              <Image
                width={690}

   height={690}                src={`https://api.fayda.pro.et/${data.images[2]}`} 
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

      <div className="flex gap-4 mt-4 flex-wrap">
        {downloadOptions.map((option) => (
          <Button
            key={option.key}
            onClick={option.onClick}
            disabled={!!downloadLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {downloadLoading === option.key ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <option.icon className="mr-2 h-4 w-4" />
            )}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}