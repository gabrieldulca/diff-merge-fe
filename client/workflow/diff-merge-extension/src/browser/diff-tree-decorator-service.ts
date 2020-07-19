import { inject, injectable, named } from 'inversify';
import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { TreeDecorator, AbstractTreeDecoratorService } from '@theia/core/lib/browser/tree/tree-decorator';

/**
 * Symbol for all decorators that would like to contribute.
 */
export const DiffTreeDecorator = Symbol('DiffTreeDecorator');

/**
 * Decorator service.
 */
@injectable()
export class DiffTreeDecoratorService extends AbstractTreeDecoratorService {

    constructor(@inject(ContributionProvider) @named(DiffTreeDecorator) protected readonly contributions: ContributionProvider<TreeDecorator>) {
        super(contributions.getContributions());
    }

}
