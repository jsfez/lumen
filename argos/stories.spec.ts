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

// Optionally restrict to a comma-separated list of story ids (fast local runs).
const only = process.env.ARGOS_ONLY?.split(',').filter(Boolean);

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && (!only || only.includes(entry.id)),
);

for (const story of stories) {
  test(`${story.title} › ${story.name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await page.waitForSelector('#storybook-root:not(:empty)');
    // The backgrounds addon injects its grid <style> asynchronously after the
    // story renders: on stories that declare a grid, wait for it to land.
    const wantsGrid = await page.evaluate(
      () =>
        !!(
          window as unknown as {
            __STORYBOOK_PREVIEW__?: {
              currentRender?: {
                story?: {
                  storyGlobals?: { backgrounds?: { grid?: boolean } };
                };
              };
            };
          }
        ).__STORYBOOK_PREVIEW__?.currentRender?.story?.storyGlobals?.backgrounds
          ?.grid,
    );
    if (wantsGrid) {
      await page.waitForSelector('style#addon-backgrounds-grid', {
        state: 'attached',
      });
    }
    // Loading/skeleton stories keep `aria-busy="true"` forever by design:
    // don't wait for it to clear before screenshotting.
    const isLoadingState = /loading|skeleton/i.test(
      `${story.title} ${story.name}`,
    );
    await argosScreenshot(page, story.id, {
      stabilize: isLoadingState ? { waitForAriaBusy: false } : true,
    });
  });
}
