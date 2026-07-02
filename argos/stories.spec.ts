import { readFileSync } from 'node:fs';
import { argosScreenshot } from '@argos-ci/playwright';
import { test } from '@playwright/test';

type IndexEntry = {
  id: string;
  title: string;
  name: string;
  type: 'story' | 'docs';
  tags?: string[];
};

const index = JSON.parse(
  readFileSync(
    new URL('../libs/ui-react/storybook-static/index.json', import.meta.url),
    'utf-8',
  ),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story',
);

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await page.waitForSelector('#storybook-root:not(:empty)');
    // Loading/skeleton stories keep `aria-busy="true"` forever by design:
    // don't wait for it to clear before screenshotting.
    const isLoadingState = /loading|skeleton/i.test(story.name);
    await argosScreenshot(page, story.id, {
      stabilize: isLoadingState ? { waitForAriaBusy: false } : true,
    });
  });
}
