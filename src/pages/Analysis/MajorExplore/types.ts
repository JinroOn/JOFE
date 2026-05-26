export interface Career {
  icon: string;
  label: string;
}

export interface Major {
  id: number;
  name: string;
  enName: string;
  category: string;
  categoryColor: string;
  iconBg: string;
  iconColor: string;
  description: string;
  fullDescription: string;
  matchRate: number;
  prospect: 'HIGH' | 'MEDIUM' | 'LOW';
  icon: string;
  scores: number[];
  careers: Career[];
}
