import * as tvGuideService from "../tvGuideService";

describe("tvGuideService", () => {
  describe("fetchTVGuide", () => {
    it("returns mock TV guide results for any query", async () => {
      const results = await tvGuideService.fetchTVGuide("anything");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]).toHaveProperty("title");
      expect(results[0]).toHaveProperty("channel");
    });
  });

  describe("fetchKnowledgeGraph (deprecated)", () => {
    it("returns empty array always", async () => {
      const results = await tvGuideService.fetchKnowledgeGraph("Supernatural");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});
