import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface InfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function InfoDialog({
  open,
  onOpenChange,
  title,
  description,
  content,
  icon,
}: InfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md neuropad-card">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          <DialogHeader>
            {icon && (
              <motion.div
                className="mx-auto mb-4 w-16 h-16 rounded-full neuropad-primary flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                {icon}
              </motion.div>
            )}
            <DialogTitle className="text-xl font-bold neuropad-text-primary text-center">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="neuropad-text-secondary text-center">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 neuropad-text-secondary">
            {content}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
