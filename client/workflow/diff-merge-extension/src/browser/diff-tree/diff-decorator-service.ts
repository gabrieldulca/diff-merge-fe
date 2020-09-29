import { AbstractTreeDecoratorService, TreeDecorator } from "@theia/core/lib/browser/tree/tree-decorator";
import { ContributionProvider } from "@theia/core/lib/common/contribution-provider";
import { inject, injectable, named } from "inversify";

/**
 * Symbol for all decorators that would like to contribute into the diff.
 */
export const DiffTreeDecorator = Symbol('DiffTreeDecorator');

/**
 * Decorator service for the diffs.
 */
@injectable()
export class DiffDecoratorService extends AbstractTreeDecoratorService {

    constructor(@inject(ContributionProvider) @named(DiffTreeDecorator) protected readonly contributions: ContributionProvider<TreeDecorator>) {
        super(contributions.getContributions());
    }

}
