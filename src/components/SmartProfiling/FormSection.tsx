/**
 * Form Section Component
 * =====================
 * Reusable wrapper for each form section
 * Provides consistent spacing, styling, and animations
 */

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FormSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const FormSection = ({ id, title, subtitle, children }: FormSectionProps) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3 }}
      className="form-section bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm"
    >
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      {/* Section Content */}
      <div className="section-content">
        {children}
      </div>
    </motion.section>
  );
};

export default FormSection;
