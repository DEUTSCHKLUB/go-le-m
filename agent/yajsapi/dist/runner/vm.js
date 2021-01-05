"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repo = exports.VmPackageFormat = void 0;
const base_1 = require("../props/base");
const common_1 = require("./common");
const inf_1 = require("../props/inf");
var VmPackageFormat;
(function (VmPackageFormat) {
    VmPackageFormat["UNKNOWN"] = "";
    VmPackageFormat["GVMKIT_SQUASH"] = "gvmkit-squash";
})(VmPackageFormat = exports.VmPackageFormat || (exports.VmPackageFormat = {}));
class _InfVm extends inf_1.InfBase {
    constructor() {
        super(...arguments);
        this.runtime = new base_1.Field({
            value: inf_1.RuntimeType.VM,
            metadata: { key: inf_1.INF_RUNTIME },
        });
    }
}
const _InfVmKeys = inf_1.InfBase.fields(new _InfVm(), ["cores", "mem", "storage", "runtime"]);
class _VmConstrains extends common_1.Constraints {
    constructor(min_mem_gib, min_storage_gib, min_cores = 1) {
        super();
        super.extend([
            `(${_InfVmKeys["cores"]}>=${min_cores})`,
            `(${_InfVmKeys["mem"]}>=${min_mem_gib})`,
            `(${_InfVmKeys["storage"]}>=${min_storage_gib})`,
            `(${_InfVmKeys["runtime"]}=${inf_1.RuntimeType.VM})`,
        ]);
    }
}
class _VmRequest extends inf_1.ExeUnitRequest {
    constructor(package_url, package_format) {
        super(package_url);
        this.package_format = new base_1.Field({
            metadata: { key: "golem.srv.comp.vm.package_format" },
        });
        this.package_format.value = package_format;
    }
}
async function repo(image_hash, min_mem_gib = 0.5, min_storage_gib = 2.0, min_cores = 1, image_format = VmPackageFormat.GVMKIT_SQUASH, image_repo = common_1.DEFAULT_REPO_URL) {
    let pkg_url = await common_1.resolve_url(image_repo, image_hash);
    return new common_1.DemandDecor(new _VmConstrains(min_mem_gib, min_storage_gib, min_cores), new _VmRequest(pkg_url, image_format));
}
exports.repo = repo;
//# sourceMappingURL=vm.js.map