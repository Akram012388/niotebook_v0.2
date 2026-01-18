import type { GenericId } from "convex/values";
import type { DomainId } from "../src/domain/ids";

const toDomainId = <T extends string>(id: GenericId<T>): DomainId<T> => {
  return id as unknown as DomainId<T>;
};

const toGenericId = <T extends string>(id: DomainId<T>): GenericId<T> => {
  return id as unknown as GenericId<T>;
};

export { toDomainId, toGenericId };
