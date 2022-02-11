import { createRepository, TagProvider } from "./index";
import "mocha";
import { expect } from "chai";

describe("TagProvider", () => {
  let repo: TagProvider;
  beforeEach(() => {
    repo = createRepository();
  });

  describe(".get", () => {
    it("returns undefined when a tag is not set", async () => {
      const value = await repo
        .tagbag("server", "owner1")
        .tag("duplicated")
        .get();
      expect(value).to.eq(undefined);
    });

    it("returns a fallback when a tag is not set", async () => {
      const value = await repo
        .tagbag("server", "owner1")
        .tag("duplicated")
        .get("fb");
      expect(value).to.eq("fb");
    });
  });

  describe(".set", () => {
    it("get a previously set tag", async () => {
      await repo.tagbag("server", "owner1").tag("duplicated").set(5);
      expect((repo as any).memory["server:owner1:duplicated"]).to.eq(5);
    });
  });

  describe(".delete", () => {
    it("can delete a tag", async () => {
      await repo.tagbag("server", "owner1").tag("duplicated").set(5);
      await repo.tagbag("server", "owner1").tag("duplicated").delete();
      const value = await repo
        .tagbag("server", "owner1")
        .tag("duplicated")
        .get();
      expect(value).to.eq(undefined);
    });
  });

  describe("setting different keys", () => {
    it("is different when the tag changes", async () => {
      await repo.tagbag("server", "owner1").tag("key1").set("a");
      await repo.tagbag("server", "owner1").tag("key2").set("b");

      const first = await repo.tagbag("server", "owner1").tag("key1").get();
      const second = await repo.tagbag("server", "owner1").tag("key2").get();
      expect(first).to.eq("a");
      expect(second).to.eq("b");
    });

    it("is different when the owner changes", async () => {
      await repo.tagbag("server", "owner1").tag("key1").set("a");
      await repo.tagbag("server", "owner2").tag("key1").set("b");

      const first = await repo.tagbag("server", "owner1").tag("key1").get();
      const second = await repo.tagbag("server", "owner2").tag("key1").get();
      expect(first).to.eq("a");
      expect(second).to.eq("b");
    });

    it("is different when the server changes", async () => {
      await repo.tagbag("server", "owner1").tag("key1").set("a");
      await repo.tagbag("another_server", "owner1").tag("key1").set("b");

      const first = await repo.tagbag("server", "owner1").tag("key1").get();
      const second = await repo
        .tagbag("another_server", "owner1")
        .tag("key1")
        .get();

      expect(first).to.eq("a");
      expect(second).to.eq("b");
    });
  });
});
