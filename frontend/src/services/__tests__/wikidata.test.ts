import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  searchWikidataEntities,
  searchWikidataEntitiesImmediate,
} from "../wikidata";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(axios.get);

describe("wikidata service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("returns an empty result immediately for blank debounced queries", async () => {
    await expect(searchWikidataEntities("   ")).resolves.toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("maps debounced search results and strips titleSnippet HTML", async () => {
    vi.useFakeTimers();
    mockedGet.mockResolvedValue({
      data: {
        results: [
          {
            titleSnippet: "<span>Gardening</span>",
            pageId: "Q1",
            description: "Growing plants",
            aliases: ["horticulture"],
          },
          {
            label: "Cooking",
            pageId: "Q2",
          },
          {
            pageId: "Q3",
          },
        ],
      },
    });

    const resultPromise = searchWikidataEntities("  garden  ", "tr", 5, 100);
    await vi.advanceTimersByTimeAsync(100);

    await expect(resultPromise).resolves.toEqual([
      {
        label: "Gardening",
        entityId: "Q1",
        description: "Growing plants",
        aliases: ["horticulture"],
      },
      {
        label: "Cooking",
        entityId: "Q2",
        description: undefined,
        aliases: [],
      },
    ]);
    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/wikidata\/search$/), {
      params: { query: "garden", language: "tr", limit: 5 },
    });
  });

  it("debounced search resolves empty results on API errors", async () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedGet.mockRejectedValue(new Error("network down"));

    const resultPromise = searchWikidataEntities("garden", "en", 10, 50);
    await vi.advanceTimersByTimeAsync(50);

    await expect(resultPromise).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("immediate search trims input and returns raw API results", async () => {
    const results = [{ label: "Gardening", entityId: "Q1" }];
    mockedGet.mockResolvedValue({ data: { results } });

    await expect(
      searchWikidataEntitiesImmediate("  garden  ", "en", 7),
    ).resolves.toEqual(results);

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/\/wikidata\/search$/), {
      params: { query: "garden", language: "en", limit: 7 },
    });
  });

  it("immediate search returns empty results for blank input and errors", async () => {
    await expect(searchWikidataEntitiesImmediate("")).resolves.toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedGet.mockRejectedValue(new Error("unavailable"));

    await expect(searchWikidataEntitiesImmediate("garden")).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
