import { TrendingUp, Users, Coins } from "lucide-react";

interface StatsGridProps {
  totalUsers: number;
  coinValue: number;
  totalMined: number;
}

const StatsGrid = ({ totalUsers, coinValue, totalMined }: StatsGridProps) => {
  const stats = [
    {
      label: "Coin Value",
      value: `${coinValue} RWF`,
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: "text-secondary",
    },
    {
      label: "Total Mined",
      value: totalMined.toLocaleString(),
      icon: Coins,
      color: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-gradient-card rounded-xl border border-border p-3 sm:p-4 text-center"
        >
          <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2 ${stat.color}`} />
          <p className="text-sm sm:text-lg font-display font-bold text-foreground">{stat.value}</p>
          <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 sm:mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
