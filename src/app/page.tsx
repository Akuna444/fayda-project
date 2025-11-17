'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2, Printer, Coins, Image, X } from "lucide-react";
import axios from "axios";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toPng, toJpeg } from 'html-to-image';
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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

    // Check if file is an image
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

    if (userPoints && userPoints.points === 0) {
      setError("Insufficient points. Please add more points to process PDF.");
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  }

  const downloadData = () => {
    if (!extractedData) return;

    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "extracted_id_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          {/* Template Upload Section */}
          {extractedData && (<div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Image className="h-5 w-5" />
              Custom Templates (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Template Upload */}
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

              {/* Back Template Upload */}
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

          {/* PDF Upload Section */}
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

          {userPoints && userPoints.points === 0 && <div>You have Insufficient points contact me to for more points <a href="https://t.me/NatiTG2" target="_blank" >Here</a></div>}
          
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
  const defaultFrontImageUrl = '/front-template.jpg';
  const defaultBackImageUrl = '/back-template.jpg';
  
  const frontImageUrl = customFrontTemplate || defaultFrontImageUrl;
  const backImageUrl = customBackTemplate || defaultBackImageUrl;
  
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  // Get FCN ID for barcode - remove spaces if present
  const fcnId = data.fcn_id ? data.fcn_id.replace(/\s/g, '') : '4017497305237984';

  const downloadPDF = async () => {
    if (!frontCardRef.current || !backCardRef.current) return;

    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const cardWidth = pdfWidth / 2 - 20;
      const cardHeight = (cardWidth * 800) / 1280;

      // Use html-to-image instead of html2canvas
      const [frontDataUrl, backDataUrl] = await Promise.all([
        toJpeg(frontCardRef.current, { 
          quality: 0.95,
          backgroundColor: '#ffffff'
        }),
        toJpeg(backCardRef.current, { 
          quality: 0.95,
          backgroundColor: '#ffffff'
        })
      ]);

      pdf.addImage(frontDataUrl, 'JPEG', 10, (pdfHeight - cardHeight) / 2, cardWidth, cardHeight);
      pdf.addImage(backDataUrl, 'JPEG', pdfWidth / 2 + 10, (pdfHeight - cardHeight) / 2, cardWidth, cardHeight);

      pdf.setFontSize(16);
      pdf.text('Ethiopian ID Card', pdfWidth / 2, 15, { align: 'center' });
      
      pdf.save('ethiopian-id-card.pdf');

    } catch (error) {
      console.error('PDF Generation Error:', error);
      // Fallback to print preview
      printIDCard();
    }
  };

  const printIDCard = () => {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const frontCard = frontCardRef.current?.innerHTML;
    const backCard = backCardRef.current?.innerHTML;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ethiopian ID Card</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif;
              background: white;
            }
            .print-container {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 20px;
              flex-wrap: wrap;
            }
            .id-card {
              border: 2px solid #333;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            @media print {
              body { padding: 0; }
              .print-container { gap: 10px; }
              .id-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="id-card">
              ${frontCard}
            </div>
            <div class="id-card">
              ${backCard}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      <h3 className="text-[30px] font-semibold">Preview of ID Card</h3>
      
      {/* Template Info */}
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
          className="relative mx-auto border-2 border-gray-300"
          style={{ 
            height: '800px', 
            width: '1280px',
            backgroundImage: `url("${frontImageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Profile Images */}
          {data.images && data.images.length > 0 && (
            <>
              <img 
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
              <img 
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
          <div className="absolute high-quality" style={{ top: '620px', left: '570px' }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '10px', 
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              <text className="" style={{
                fontWeight: 'bold',
                fontSize:'24px',
                letterSpacing:'5px'
              }} textAnchor="middle" x="111" y="21">
                  {data.fcn_id || '4017 4973 0523 7984'}
                </text>
              <Barcode
                value={fcnId}
                width={2.6}
                height={50}
                fontSize={16}
                format="CODE128"
                displayValue={false}
                background="white"
                lineColor="black"
                margin={10}
              />
            </div>
          </div>

          {/* Full Name Data */}
          <div className="absolute" style={{ top: '210px', left: '512px' }}>
            <h6 className="amharic-text text-[30px] font-bold text-black">{data.amharic_name || 'የኃለሽት አየለ ጉብረሖት'}</h6>
            <h6 className="english-text text-[30px] font-bold text-black">{data.english_name || 'Yehualeshet Ayele Gebrehot'}</h6>
          </div>

          {/* Date of Birth Data */}
          <div className="absolute" style={{ top: '380px', left: '510px' }}>
            <p className="amharic-text text-[30px] font-bold text-black">
              {data.birth_date_ethiopian || '11/06/1991'} | {data.birth_date_gregorian || '1999/Feb/18'}
            </p>
          </div>

          {/* Sex Data */}
          <div className="absolute" style={{ top: '457px', left: '514px' }}>
            <p className="amharic-text text-[30px] font-bold text-black">
              {data.amharic_gender || 'ሴት'} | {data.english_gender || 'Female'}
            </p>
          </div>

          {/* Date of Issue Data */}
          <div className="absolute high-quality" style={{ top: '485px', left: '-50px' }}>
            <p className="amharic-text rotate-270 text-[30px] font-bold text-black">{data.issue_date_ethiopian || '2018/03/08'}</p>
          </div>

          <div className="absolute high-quality" style={{ top: '115px', left: '-50px' }}>
            <p className="english-text rotate-270 text-[30px] font-bold text-black">{data.issue_date_gregorian || '2025/Nov/17'}</p>
          </div>

          {/* Date of Expiry Data */}
          <div className="absolute" style={{ top: '545px', left: '515px' }}>
            <p className="amharic-text text-[30px] font-bold text-black">
              {data.expiry_date_ethiopian || '2026/03/08'} | {data.expiry_date_gregorian || '2033/Nov/17'}
            </p>
          </div>
        </div>
      </div>

      {/* Back Card */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Back Side</h4>
        <div 
          ref={backCardRef}
          className="relative mx-auto border-2 border-gray-300"
          style={{ 
            height: '800px', 
            width: '1280px',
            backgroundImage: `url("${backImageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Data Container */}
          <div className="absolute"
               style={{ 
                 color: 'white',
                 padding: '5px 20px 5px 50px',
                 borderRadius: '5px',
                 width: '100%',
                 height: '100%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between'
               }}>
            
            {/* Phone Number Data */}
            <h6 className="english-text" 
                style={{ 
                  margin: '0px',
                  fontWeight: "bold",
                  fontSize: '32px',
                  lineHeight: '1.15',
                  letterSpacing: '0.5px',
                  color: 'rgb(0, 0, 0)',
                  position: 'absolute',
                  top: '93px',
                  left: '41px'
                }}>
              {data.phone_number || '0984124132'}
            </h6>

            {/* Address Data */}
            <div className="text-black font-bold " 
                 style={{ 
                   position: 'absolute',
                   left: '44px',
                   top: '290px'
                 }}>
              <h6 className="amharic-text" style={{ fontSize: '30px', marginBottom: '-5px' }}>
                {data.amharic_city || 'አማራ'}
              </h6>
              <h6 className="english-text margin_bottom" style={{ fontSize: '30px', marginBottom: '20px' }}>
                {data.english_city || 'Amhara'}
              </h6>
              <h6 className="amharic-text" style={{ fontSize: '30px', marginBottom: '-5px' }}>
                {data.amharic_sub_city || 'ባህር ዳር ልዩ ዞን'}
              </h6>
              <h6 className="english-text margin_bottom" style={{ fontSize: '30px', marginBottom: '20px' }}>
                {data.english_sub_city || 'Bahir Dar Special Zone'}
              </h6>
              <h6 className="amharic-text" style={{ fontSize: '30px', marginBottom: '-5px' }}>
                {data.amharic_woreda || 'ዳግማዊ ሚኒሊክ'}
              </h6>
              <h6 className="english-text margin_bottom" style={{ fontSize: '30px', marginBottom: '20px' }}>
                {data.english_woreda || 'Dagmawi Minilik'}
              </h6>
            </div>

            {/* FIN Number */}
            <div className="high-quality" 
                 style={{ 
                   fontWeight: 700,
                   fontSize: '30px',
                   lineHeight: '10px',
                   letterSpacing: '0px',
                   color: 'rgb(0, 0, 0)',
                   position: 'absolute',
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
                <img 
                  src={`https://api.fayda.pro.et/${data.images[2]}`} 
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

      <div className="flex gap-4 mt-4">
        <Button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button onClick={printIDCard} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Preview
        </Button>
      </div>
    </div>
  );
}