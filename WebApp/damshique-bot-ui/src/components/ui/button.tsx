export function Button({ className = "", ...props }: any) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-medium ${className}`}
      {...props}
    />
  );
}
