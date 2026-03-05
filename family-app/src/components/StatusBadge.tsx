interface Props {
  isVerified: boolean;
  isChild?: boolean;
}

export function StatusBadge({ isVerified, isChild }: Props) {
  if (isChild) {
    return <span className="badge badge-child">Child Account</span>;
  }
  if (isVerified) {
    return <span className="badge badge-verified">Verified</span>;
  }
  return <span className="badge badge-unverified">Unverified</span>;
}
