import { Loader } from "lucide-react";

type LoadingProps = {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const Loading = ({ message = "Loading content", className = "", size = "md" }: LoadingProps) => {
  return (
    <div className={`h-full w-full flex items-center justify-center ${className}`} aria-label={message}>
      <Loader className={`${sizeClasses[size]} text-muted-foreground animate-spin`} aria-hidden="true" />
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default Loading;

