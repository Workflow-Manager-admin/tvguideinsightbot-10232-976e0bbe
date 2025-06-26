import * as neo4jService from "../neo4jService";

describe("neo4jService", () => {
  describe("fetchKGInsights", () => {
    it("returns mock node and edge insights for 'Supernatural'", async () => {
      const result = await neo4jService.fetchKGInsights("Supernatural");
      // At least one is a node, one is edge, one is text
      expect(result.some(x => x.type === "node")).toBe(true);
      expect(result.some(x => x.type === "edge")).toBe(true);
      expect(result.some(x => x.type === "text")).toBe(true);
    });

    it("returns default text message for unrelated queries", async () => {
      const result = await neo4jService.fetchKGInsights("Other show");
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty("type", "text");
      expect(result[0].text).toMatch(/No knowledge graph insights found/i);
    });

    it("handles empty or missing context as Supernatural mock", async () => {
      const empty1 = await neo4jService.fetchKGInsights("");
      const empty2 = await neo4jService.fetchKGInsights();
      expect(empty1.length).toBeGreaterThan(1);
      expect(empty2.length).toBeGreaterThan(1);
    });
  });
});
