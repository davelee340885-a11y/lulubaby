import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

type ImageCropperProps = {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob, displaySettings?: {
    backgroundSize: string;
    backgroundPosition: string;
    backgroundRepeat: string;
  }) => void;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
  title?: string;
  // Display settings (only for background images)
  showDisplaySettings?: boolean;
  initialDisplaySettings?: {
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
  };
};

export default function ImageCropper({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  cropShape = "rect",
  title = "裁切圖片",
  showDisplaySettings = false,
  initialDisplaySettings = {},
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  
  // Display settings state (for background images)
  const [backgroundSize, setBackgroundSize] = useState(initialDisplaySettings.backgroundSize || "cover");
  const [backgroundPosition, setBackgroundPosition] = useState(initialDisplaySettings.backgroundPosition || "center");
  const [backgroundRepeat, setBackgroundRepeat] = useState(initialDisplaySettings.backgroundRepeat || "no-repeat");

  const onCropChange = (location: { x: number; y: number }) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      setProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Pass display settings if showDisplaySettings is true
      if (showDisplaySettings) {
        onCropComplete(croppedImage, {
          backgroundSize,
          backgroundPosition,
          backgroundRepeat,
        });
      } else {
        onCropComplete(croppedImage);
      }
      
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative h-[400px] bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">縮放</label>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
          
          {/* Display Settings - only show for background images */}
          {showDisplaySettings && (
            <>
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">即時預覽</label>
                <div 
                  className="w-full h-32 rounded-md border overflow-hidden bg-muted"
                  style={{
                    backgroundImage: `url(${imageSrc})`,
                    backgroundSize: backgroundSize,
                    backgroundPosition: backgroundPosition,
                    backgroundRepeat: backgroundRepeat,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-white/90 px-3 py-1 rounded text-xs text-muted-foreground">
                      預覽效果
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  顯示背景圖片在對話頁面中的實際效果
                </p>
              </div>
            
              <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">圖片展示方式</label>
                <select
                  value={backgroundSize}
                  onChange={(e) => setBackgroundSize(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="cover">🖼️ 填滿螢幕 - 保持比例（推薦）</option>
                  <option value="contain">📐 適應螢幕 - 完整顯示</option>
                  <option value="100% 100%">🔲 拉伸填滿 - 不保持比例</option>
                  <option value="auto">📍 原始尺寸</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">圖片位置</label>
                <select
                  value={backgroundPosition}
                  onChange={(e) => setBackgroundPosition(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="center">居中</option>
                  <option value="top">頂部</option>
                  <option value="bottom">底部</option>
                  <option value="left">左側</option>
                  <option value="right">右側</option>
                  <option value="top left">左上角</option>
                  <option value="top right">右上角</option>
                  <option value="bottom left">左下角</option>
                  <option value="bottom right">右下角</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">圖片重複</label>
                <select
                  value={backgroundRepeat}
                  onChange={(e) => setBackgroundRepeat(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="no-repeat">不重複（推薦）</option>
                  <option value="repeat">🔄 平鋪重複</option>
                  <option value="repeat-x">↔️ 水平重複</option>
                  <option value="repeat-y">↕️ 垂直重複</option>
                </select>
              </div>
            </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={processing}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            確認裁切
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
