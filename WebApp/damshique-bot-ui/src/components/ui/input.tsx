export function Input({ className = "", ...props }: any) {
  return (
    <input
      className={`px-4 py-2 outline-none ${className}`}
      {...props}
    />
  );
}
