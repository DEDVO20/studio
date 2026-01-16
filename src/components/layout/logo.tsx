import { cn } from '@/lib/utils';

// SVG path for the 'Activity' icon from lucide-react, used as the store logo.
export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('h-5 w-5', className)}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
