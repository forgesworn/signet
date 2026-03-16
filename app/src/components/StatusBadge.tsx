interface Props {
  isVerified: boolean;
  isChild?: boolean;
  /** Override badge display based on credential state */
  credentialStatus?: 'confirmed' | 'pending' | null;
}

export function StatusBadge({ isVerified, isChild, credentialStatus }: Props) {
  if (isChild) {
    return <span className="badge badge-child">Child Account</span>;
  }
  if (credentialStatus === 'confirmed') {
    return <span className="badge badge-verified">Verified</span>;
  }
  if (credentialStatus === 'pending') {
    return <span className="badge badge-pending" style={{ background: 'var(--warning-light, #fff8e1)', color: 'var(--warning, #f9a825)', border: '1px solid var(--warning, #f9a825)' }}>Pending</span>;
  }
  if (isVerified) {
    return <span className="badge badge-verified">Verified</span>;
  }
  return <span className="badge badge-unverified">Unverified</span>;
}
