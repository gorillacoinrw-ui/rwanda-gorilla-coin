import { useNews } from "@/hooks/use-news";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import { format } from "date-fns";

export const NewsFeed = () => {
  const { data: news, isLoading } = useNews();

  if (isLoading || !news || news.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
        <Newspaper className="w-5 h-5 text-primary" />
        Latest Updates
      </h2>
      <div className="grid gap-4">
        {news.map((item) => (
          <Card key={item.id} className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">{item.title}</CardTitle>
              <CardDescription className="text-xs">
                {format(new Date(item.created_at), "MMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
