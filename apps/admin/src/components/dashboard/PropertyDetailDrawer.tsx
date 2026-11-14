"use client";

import React from "react";
import { PropertyItem } from "./types";
import { PropertyFullPagePreview } from "./PropertyFullPagePreview";

export interface PropertyDetailDrawerProps {
  property: PropertyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<void> | void;
  onRequestRevisions: (property: PropertyItem) => void;
}

/**
 * PropertyDetailDrawer renders the full-page property preview identical to the guest portal.
 * For unpublished listings, includes a prominent 'Under Review' status badge while maintaining the complete layout.
 */
export function PropertyDetailDrawer({
  property,
  isOpen,
  onClose,
  onApprove,
  onRequestRevisions,
}: PropertyDetailDrawerProps) {
  if (!isOpen || !property) return null;

  return (
    <PropertyFullPagePreview
      property={property}
      isOpen={isOpen}
      onClose={onClose}
      onApprove={onApprove}
      onRequestRevisions={onRequestRevisions}
    />
  );
}

export { PropertyFullPagePreview };
