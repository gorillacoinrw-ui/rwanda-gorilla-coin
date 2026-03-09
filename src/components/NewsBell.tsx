import { Newspaper } from "lucide-react";
import { useNews } from "@/hooks/use-news";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const NewsBell = () => {
  const { data: news } = useNews();
  const count = news?.length ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Newspaper className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Latest Updates</h3>
        </div>
        <ScrollArea className="h-[360px]">
          {count === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No updates yet
            </div>
          ) : (
            news?.map((item) => (
              <div key={item.id} className="p-3 border-b border-border/50 last:border-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
                <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                  {format(new Date(item.created_at), "MMM d, yyyy")}
                </span>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NewsBell;