import Image from "next/image";
import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import type { Post } from "@/lib/api/types";
import { formatarDataLonga } from "@/lib/utils/format";

export function PostCard({ post, destaque = false }: { post: Post; destaque?: boolean }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className={`card-elevated card-elevated-hover group flex h-full flex-col overflow-hidden ${destaque ? "md:flex-row" : ""}`}>
      <Link href={href} className={`relative block overflow-hidden ${destaque ? "aspect-[16/10] md:aspect-auto md:w-1/2" : "aspect-[16/10]"}`} aria-hidden tabIndex={-1}>
        <Image
          src={post.imagem_url}
          alt=""
          fill
          sizes={destaque ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>
      <div className={`flex flex-1 flex-col p-5 ${destaque ? "md:p-8" : ""}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <time dateTime={post.publicado_em} className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden />
            {formatarDataLonga(post.publicado_em)}
          </time>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" aria-hidden />
            {post.autor}
          </span>
        </div>
        <h3 className={`mt-3 font-semibold leading-snug ${destaque ? "text-2xl" : "text-lg"}`}>
          <Link href={href} className="hover:text-brand">
            {post.titulo}
          </Link>
        </h3>
        <p className={`mt-2 text-sm text-muted-foreground ${destaque ? "line-clamp-4" : "line-clamp-3"}`}>{post.resumo}</p>
        <Link href={href} className="mt-auto inline-block pt-4 text-sm font-semibold text-brand hover:underline">
          Continuar lendo →
        </Link>
      </div>
    </article>
  );
}
