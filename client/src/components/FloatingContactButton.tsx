import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FloatingContactButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/contact')}
      aria-label="Contact us"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-150"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
