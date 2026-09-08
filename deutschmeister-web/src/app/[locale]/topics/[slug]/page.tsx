import type { TopicWithWords } from '@/types/topic';
import { fetchTopicDetail } from '@/lib/seo/content';
import { TopicView } from './_components/TopicView';

/**
 * Server shell for a topic.
 *
 * These are the largest body of indexable content the app has — 198 pages, each
 * with roughly forty German words, their articles and example sentences. All of
 * it used to arrive after hydration, so the HTML held none of it: a crawl of the
 * "Familie und Freunde" page found no *Mutter*, no *Schwester*, just a skeleton.
 *
 * Fetching here and passing the topic down as `initialData` ships the words in
 * the first response, and the client view is otherwise untouched.
 */
export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Null on a miss or an API blip; the client query then fetches as before.
  const topic = await fetchTopicDetail<TopicWithWords>(slug);

  return <TopicView initialTopic={topic ?? undefined} />;
}
