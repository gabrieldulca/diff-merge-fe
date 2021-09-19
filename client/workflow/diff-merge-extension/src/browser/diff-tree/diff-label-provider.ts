import { LabelProvider } from "@theia/core/lib/browser";

export class DiffLabelProvider extends LabelProvider {

    getIcon(element: object): string {
        return "fa-chevron-down";
    }
}
