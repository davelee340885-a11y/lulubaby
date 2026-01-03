import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// 使用 Stripe 測試公鑰
const stripePromise = loadStripe("pk_test_51SlSyGGRVm9ShSoQMjBofNZJgxPWmmCGQrfxOSgCugGc0JwMaTms67YRanYUl6NrIPgVBKGFoywdic1QOp4fmlyZ00w0z1I3gV");

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ clientSecret, amount, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/domain?payment=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "支付失敗");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("支付成功！");
        onSuccess();
      }
    } catch (err) {
      toast.error("支付處理失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">支付金額</span>
          <span className="text-2xl font-bold">HK${(amount / 100).toFixed(2)}</span>
        </div>
      </div>

      <PaymentElement />

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
        <p className="text-sm font-medium">測試卡號：</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✅ 成功支付：<code className="bg-background px-2 py-1 rounded">4242 4242 4242 4242</code></li>
          <li>⚠️ 需要 3D 驗證：<code className="bg-background px-2 py-1 rounded">4000 0025 0000 3155</code></li>
          <li>❌ 被拒絕：<code className="bg-background px-2 py-1 rounded">4000 0000 0000 0002</code></li>
          <li>有效期：任何未來日期（例如：12/25）</li>
          <li>CVC：任何 3 位數字（例如：123）</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              處理中...
            </>
          ) : (
            `確認支付 HK$${(amount / 100).toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        clientSecret={clientSecret}
        amount={amount}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
