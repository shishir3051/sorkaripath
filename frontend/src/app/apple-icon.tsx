import { renderBrandIconResponse } from "@/lib/brandIcon";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return renderBrandIconResponse(size.width, false);
}
