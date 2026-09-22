import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** UI_SPEC §1.1/§2 toast durations: success 4s, info 6s, error stays until closed. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast: 'bg-popover text-popover-foreground border border-border shadow-e2 rounded-lg',
        },
        duration: 4000,
      }}
      {...props}
    />
  );
}
