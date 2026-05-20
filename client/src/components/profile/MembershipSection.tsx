import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MembershipUpgradeCard } from '@/components/MembershipBadge';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { keys } from '@/lib/queryKeys';

export function MembershipSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: membership = { tier: 'regular' } } = useQuery({
    queryKey: keys.membership.status(),
    queryFn: () => api.getMembershipStatus(),
  });

  const handleUpgrade = async (tier: 'gold' | 'silver') => {
    try {
      const order = await api.createMembershipOrder(tier);
      if (!order.orderId || !order.keyId) {
        await api.purchaseMembership(tier);
        qc.invalidateQueries({ queryKey: keys.membership.status() });
        toast({ title: 'Success', description: `Upgraded to ${tier} membership!` });
        return;
      }
      await openRazorpayCheckout({
        orderId: order.orderId, amount: order.amount, currency: order.currency, keyId: order.keyId,
        name: `Kalakaarian ${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership`,
        prefill: { name: user?.name, email: user?.email },
        onSuccess: async (paymentId, orderId, signature) => {
          await api.purchaseMembership(tier, { razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: signature });
          qc.invalidateQueries({ queryKey: keys.membership.status() });
          toast({ title: 'Payment successful!', description: `${tier} membership activated.` });
        },
        onDismiss: () => toast({ title: 'Payment cancelled' }),
      });
    } catch { toast({ title: 'Error', description: 'Failed to process payment', variant: 'destructive' }); }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Membership</h2>
      <MembershipUpgradeCard currentTier={membership.tier as 'gold' | 'silver' | 'regular'} onUpgrade={handleUpgrade} />
    </div>
  );
}
