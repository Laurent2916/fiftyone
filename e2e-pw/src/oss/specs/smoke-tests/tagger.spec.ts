import { test as base, expect } from "src/oss/fixtures";
import { GridActionsRowPom } from "src/oss/poms/action-row/grid-actions-row";
import { GridTaggerPom } from "src/oss/poms/action-row/tagger/grid-tagger";
import { GridPom } from "src/oss/poms/grid";
import { SidebarPom } from "src/oss/poms/sidebar";
import { getUniqueDatasetNameWithPrefix } from "src/oss/utils";

const datasetName = getUniqueDatasetNameWithPrefix("smoke-quickstart");

const test = base.extend<{
  tagger: GridTaggerPom;
  sidebar: SidebarPom;
  grid: GridPom;
  gridActionsRow: GridActionsRowPom;
}>({
  tagger: async ({ page }, use) => {
    await use(new GridTaggerPom(page));
  },
  sidebar: async ({ page }, use) => {
    await use(new SidebarPom(page));
  },
  grid: async ({ page, eventUtils }, use) => {
    await use(new GridPom(page, eventUtils));
  },
  gridActionsRow: async ({ page, eventUtils }, use) => {
    await use(new GridActionsRowPom(page, eventUtils));
  },
});

test.describe("tag", () => {
  test.beforeAll(async ({ fiftyoneLoader }) => {
    await fiftyoneLoader.loadZooDataset("quickstart", datasetName, {
      max_samples: 5,
    });
  });

  test.beforeEach(async ({ page, fiftyoneLoader }) => {
    await fiftyoneLoader.waitUntilGridVisible(page, datasetName);
  });

  test("sample tag and label tag loads correct aggregation number on default view", async ({
    gridActionsRow,
    tagger,
  }) => {
    await gridActionsRow.toggleTagSamplesOrLabels();
    await tagger.setActiveTaggerMode("sample");
    const placeHolder = await tagger.getTagInputTextPlaceholder("sample");
    expect(placeHolder.includes(" 5 ")).toBe(true);

    await tagger.setActiveTaggerMode("label");
    const placeHolder2 = await tagger.getTagInputTextPlaceholder("label");
    expect(placeHolder2.includes(" 143 ")).toBe(true);

    await gridActionsRow.toggleTagSamplesOrLabels();
  });

  test("In grid, I can add a new sample tag to all new samples", async ({
    grid,
    gridActionsRow,
    page,
    sidebar,
    tagger,
  }) => {
    await sidebar.clickFieldCheckbox("tags");
    await sidebar.clickFieldDropdown("tags");
    // mount eventListener
    const gridRefreshedEventPromise = grid.getWaitForGridRefreshPromise();

    await gridActionsRow.toggleTagSamplesOrLabels();
    await tagger.setActiveTaggerMode("sample");
    await tagger.addNewTag("sample", "test1");

    await gridRefreshedEventPromise;

    const bubble = page.getByTestId("tag-tags-test1");
    await expect(bubble).toHaveCount(5);
  });

  test("In grid, I can add a new label tag to all new samples", async ({
    grid,
    gridActionsRow,
    page,
    sidebar,
    tagger,
  }) => {
    await sidebar.clickFieldCheckbox("_label_tags");
    await sidebar.clickFieldDropdown("_label_tags");
    // mount eventListener
    const gridRefreshedEventPromise = grid.getWaitForGridRefreshPromise();

    await gridActionsRow.toggleTagSamplesOrLabels();
    await tagger.setActiveTaggerMode("label");
    await tagger.addNewTag("label", "labelTest");

    await gridRefreshedEventPromise;
    // verify the bubble in the image
    // the first sample has 17 label tag count, the second sample has 22 tag count
    const bubble1 = page.getByTestId("tag-_label_tags-labeltest:-17");
    const bubble2 = page.getByTestId("tag-_label_tags-labeltest:-22");
    await expect(bubble1).toBeVisible();
    await expect(bubble2).toBeVisible();
  });
});
