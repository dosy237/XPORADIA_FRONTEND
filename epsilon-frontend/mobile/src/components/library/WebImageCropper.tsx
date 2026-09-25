import { useEffect, useRef, useState } from "react";

import { Colors } from "@/constants/theme";

interface WebImageCropperProps {
  imageUri: string;
  /** Ratio largeur/hauteur, ex. [3, 4] pour une couverture de livre. */
  aspect: [number, number];
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

const FRAME_WIDTH = 280;

/** Recadrage (zoom + déplacement) pour le web — `expo-image-picker` sait
 * ouvrir un éditeur de recadrage natif via `allowsEditing` sur iOS/Android,
 * mais cette option n'a aucun effet sur le web (le sélecteur de fichier du
 * navigateur s'ouvre directement, sans étape de recadrage). Ce composant
 * ne s'affiche donc que sur web, en repli du même geste natif. */
export function WebImageCropper({ imageUri, aspect, onCancel, onConfirm }: WebImageCropperProps) {
  const frameHeight = Math.round((FRAME_WIDTH * aspect[1]) / aspect[0]);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUri;
  }, [imageUri]);

  if (!naturalSize) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
      >
        <span style={{ color: "#fff", fontSize: 13 }}>Chargement de l&apos;image...</span>
      </div>
    );
  }

  const baseScale = Math.max(FRAME_WIDTH / naturalSize.w, frameHeight / naturalSize.h);
  const displayWidth = naturalSize.w * baseScale * zoom;
  const displayHeight = naturalSize.h * baseScale * zoom;

  const maxOffsetX = Math.max(0, (displayWidth - FRAME_WIDTH) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - frameHeight) / 2);
  const clampedX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x));
  const clampedY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: clampedX, origY: clampedY };
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    });
  };
  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;
    const outputWidth = 720;
    const outputHeight = Math.round((outputWidth * aspect[1]) / aspect[0]);
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgLeft = FRAME_WIDTH / 2 - displayWidth / 2 + clampedX;
    const imgTop = frameHeight / 2 - displayHeight / 2 + clampedY;
    const sx = (-imgLeft / displayWidth) * naturalSize.w;
    const sy = (-imgTop / displayHeight) * naturalSize.h;
    const sWidth = (FRAME_WIDTH / displayWidth) * naturalSize.w;
    const sHeight = (frameHeight / displayHeight) * naturalSize.h;

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outputWidth, outputHeight);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onConfirm(new File([blob], "couverture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 1000, gap: 16,
      }}
    >
      <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Ajustez le cadrage</span>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: FRAME_WIDTH, height: frameHeight, overflow: "hidden", position: "relative",
          borderRadius: 16, cursor: "grab", touchAction: "none", background: "#0F172A",
        }}
      >
        {/* eslint-disable-next-line react/no-unknown-property */}
        <img
          ref={imgRef}
          src={imageUri}
          draggable={false}
          alt=""
          style={{
            position: "absolute",
            left: FRAME_WIDTH / 2 - displayWidth / 2 + clampedX,
            top: frameHeight / 2 - displayHeight / 2 + clampedY,
            width: displayWidth,
            height: displayHeight,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      </div>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        style={{ width: FRAME_WIDTH }}
        aria-label="Zoom"
      />
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            padding: "10px 22px", borderRadius: 999, border: "none",
            background: "#E2E8F0", color: Colors.navy, fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          style={{
            padding: "10px 22px", borderRadius: 999, border: "none",
            background: Colors.orange, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Valider le cadrage
        </button>
      </div>
    </div>
  );
}
