import { DemandDecor } from "./common";
export declare enum VmPackageFormat {
    UNKNOWN = "",
    GVMKIT_SQUASH = "gvmkit-squash"
}
export declare function repo(image_hash: string, min_mem_gib?: number, min_storage_gib?: number, min_cores?: number, image_format?: VmPackageFormat, image_repo?: string): Promise<DemandDecor>;
