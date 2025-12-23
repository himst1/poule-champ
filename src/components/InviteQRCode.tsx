import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, QrCode, Share2, MessageCircle, Mail, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InviteQRCodeProps {
  inviteCode: string;
  pouleName?: string;
  showButton?: boolean;
}

const InviteQRCode = ({ inviteCode, pouleName, showButton = true }: InviteQRCodeProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Create the invite URL
  const baseUrl = window.location.origin;
  const inviteUrl = `${baseUrl}/dashboard?code=${inviteCode}`;

  // Share message
  const shareMessage = pouleName 
    ? `Doe mee met mijn poule "${pouleName}"! Gebruik code: ${inviteCode} of klik op de link:`
    : `Doe mee met mijn poule! Gebruik code: ${inviteCode} of klik op de link:`;

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Gekopieerd!",
      description: "De uitnodigingscode is gekopieerd naar je klembord",
    });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link gekopieerd!",
      description: "De uitnodigingslink is gekopieerd naar je klembord",
    });
  };

  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);
      }
      const pngUrl = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `poule-invite-${inviteCode}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);

      toast({
        title: "QR-code gedownload!",
        description: "De QR-code is opgeslagen als afbeelding",
      });
    };
    img.src = svgUrl;
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${inviteUrl}`)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareViaEmail = () => {
    const subject = pouleName ? `Uitnodiging voor poule: ${pouleName}` : "Uitnodiging voor mijn poule";
    const body = `${shareMessage}\n\n${inviteUrl}\n\nOf gebruik de code: ${inviteCode}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}&quote=${encodeURIComponent(shareMessage)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const shareViaTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(inviteUrl)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pouleName ? `Uitnodiging: ${pouleName}` : "Poule Uitnodiging",
          text: shareMessage,
          url: inviteUrl,
        });
        toast({
          title: "Gedeeld!",
          description: "De uitnodiging is gedeeld",
        });
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== "AbortError") {
          copyInviteLink();
        }
      }
    } else {
      copyInviteLink();
    }
  };

  const QRContent = () => (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code */}
      <div
        ref={qrRef}
        className="p-4 bg-white rounded-xl shadow-lg"
      >
        <QRCodeSVG
          value={inviteUrl}
          size={180}
          level="H"
          includeMargin
          fgColor="#0a0f14"
          bgColor="#ffffff"
        />
      </div>

      {/* Invite Code Display */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Uitnodigingscode</p>
        <div className="flex items-center justify-center gap-2">
          <code className="text-xl font-mono font-bold tracking-widest text-primary">
            {inviteCode}
          </code>
          <Button variant="ghost" size="icon" onClick={copyInviteCode} className="h-8 w-8">
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="w-full space-y-3">
        <p className="text-sm text-muted-foreground text-center">Deel via</p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={shareViaWhatsApp}
            className="h-11 w-11 rounded-full bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20 hover:border-[#25D366]/50"
            title="Deel via WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={shareViaEmail}
            className="h-11 w-11 rounded-full"
            title="Deel via Email"
          >
            <Mail className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={shareViaFacebook}
            className="h-11 w-11 rounded-full bg-[#1877F2]/10 border-[#1877F2]/30 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50"
            title="Deel via Facebook"
          >
            <Facebook className="w-5 h-5 text-[#1877F2]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={shareViaTwitter}
            className="h-11 w-11 rounded-full bg-[#1DA1F2]/10 border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/50"
            title="Deel via X (Twitter)"
          >
            <Twitter className="w-5 h-5 text-[#1DA1F2]" />
          </Button>
          {typeof navigator !== "undefined" && navigator.share && (
            <Button
              variant="outline"
              size="icon"
              onClick={shareNative}
              className="h-11 w-11 rounded-full"
              title="Meer opties"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={copyInviteLink}
        >
          <Copy className="w-4 h-4" />
          Kopieer Link
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={downloadQRCode}
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-[250px]">
        Scan de QR-code of deel de link om vrienden uit te nodigen
      </p>
    </div>
  );

  if (!showButton) {
    return <QRContent />;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <QrCode className="w-4 h-4" />
          QR-code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {pouleName ? `Uitnodigen voor ${pouleName}` : "Deel je Poule"}
          </DialogTitle>
        </DialogHeader>
        <QRContent />
      </DialogContent>
    </Dialog>
  );
};

export default InviteQRCode;
