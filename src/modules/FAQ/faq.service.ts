import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { PageRequest } from 'src/common/dto/page-request.dto';
import { createPaginatedResponse } from 'src/common/dto/pagination.dto';
import { Role } from 'src/enums/user-role';
import { InvalidRequestException, ResourceNotFoundException } from 'src/exceptions';
import { SecurityUtil } from 'src/utils/security.util';
import { FaqRepository } from './faq.repository';
import { FAQSpecification } from './faq.specification';

@Injectable()
export class FaqService {
    constructor(
        private readonly faqRepository: FaqRepository,
        private readonly securityUtil: SecurityUtil,
    ) {}

    async createFAQ(sentence: string) {
        const loggedInUser = await this.securityUtil.getLoggedInUser();

        const faq = await this.faqRepository.createFAQ(
            sentence,
            loggedInUser.roleAliases as Role, // Assuming the first role is used
            loggedInUser.userId,
        );
        return {
            message: 'Common sentence created successfully.',
            faq,
        };
    }

    async deleteFAQ(id: number) {
        const loggedInUser = await this.securityUtil.getLoggedInUser();
        const faq = await this.faqRepository.findOne({
            where: { id },
            relations: ['createdBy'],
        });

        if (!faq) {
            return { message: 'Common sentence not found.' };
        }

        // Allow only the creator to delete
        if (faq.createdBy?.id !== loggedInUser.userId) {
            return { message: 'You are not authorized to delete this common sentence.' };
        }

        await this.faqRepository.delete(id);
        return { message: 'Common sentence deleted successfully.' };
    }

    async getFaqsByRole(role: Role, sentence: string, isActive: boolean, pageRequest: PageRequest) {
        const loggedInUser = await this.securityUtil.getLoggedInUser();

        const queryBuilder = this.faqRepository.createQueryBuilder('faq').leftJoin('faq.createdBy', 'createdBy');

        FAQSpecification.matchSentence(queryBuilder, sentence);
        FAQSpecification.matchStatus(queryBuilder, isActive);
        FAQSpecification.matchRole(queryBuilder, role);
        FAQSpecification.distinctFaqs(queryBuilder);

        const [faqs, total] = await queryBuilder
            .orderBy('faq.id', 'DESC')

            .getManyAndCount();

        return createPaginatedResponse(faqs, total, pageRequest);
    }

    async getFaqsByLoggedInUser() {
        const loggedInUser = await this.securityUtil.getLoggedInUser();

        const faqs = await this.faqRepository.find({
            where: { createdBy: { id: loggedInUser.userId } },
            relations: ['createdBy'],
        });

        return instanceToPlain(faqs);
    }

    // async getAdminAndOwnAgentFaqs(sentence: string, self: boolean, pageRequest: PageRequest) {
    //     const queryBuilder = this.faqRepository.createQueryBuilder('faq').leftJoinAndSelect('faq.createdBy', 'createdBy');
    //
    //     const user = await this.securityUtil.getLoggedInUser();
    //
    //     FAQSpecification.distinctFaqs(queryBuilder);
    //     FAQSpecification.matchSentence(queryBuilder, sentence);
    //     FAQSpecification.matchAdminOrSelf(queryBuilder, user.userId);
    //
    //     if (self) {
    //         FAQSpecification.matchSelf(queryBuilder, user.userId);
    //     }
    //
    //     const [faqs, total] = await queryBuilder
    //         .orderBy('faq.id', 'DESC')
    //         .skip(pageRequest.page * pageRequest.size)
    //         .take(pageRequest.size)
    //         .getManyAndCount();
    //
    //     return createPaginatedResponse(faqs, total, pageRequest);
    // }

    async getAdminAndOwnAgentFaqs(sentence: string, self: boolean, pageRequest: PageRequest) {
        const queryBuilder = this.faqRepository.createQueryBuilder('faq').leftJoinAndSelect('faq.createdBy', 'createdBy');

        const user = await this.securityUtil.getLoggedInUser();

        // Apply FAQ specifications
        FAQSpecification.distinctFaqs(queryBuilder);
        FAQSpecification.matchSentence(queryBuilder, sentence);
        FAQSpecification.matchAdminOrSelf(queryBuilder, user.userId);

        if (self) {
            FAQSpecification.matchSelf(queryBuilder, user.userId);
        }

        // Apply pagination only if `page` and `size` are provided
        if (pageRequest.page && pageRequest.size) {
            queryBuilder
                .orderBy('faq.id', 'DESC')
                .skip(pageRequest.page * pageRequest.size)
                .take(pageRequest.size);
        } else {
            // If no pagination is provided, fetch all FAQs
            queryBuilder.orderBy('faq.id', 'DESC');
        }

        // Fetch the FAQs data and total count based on pagination conditions
        const [faqs, total] = await queryBuilder.getManyAndCount();

        // Calculate `selfCount` and `allCount`
        const selfCount = await this.faqRepository.createQueryBuilder('faq').where('faq.createdBy = :userId', { userId: user.userId }).getCount();

        // Calculate `allCount` (FAQs created by the logged-in user or an admin)
        const allCount = await this.faqRepository
            .createQueryBuilder('faq')
            .leftJoin('faq.createdBy', 'createdBy')
            .where('faq.createdById = :userId OR createdBy.role = :role', { userId: user.userId, role: 'admin' })
            .getCount();

        // Modify the createdBy field to include only id and username
        const faqsDto = faqs.map((faq) => {
            return {
                ...faq,
                createdBy: {
                    id: faq.createdBy.id,
                    username: faq.createdBy.username,
                },
            };
        });

        // If pagination is applied, return paginated response
        if (pageRequest.page && pageRequest.size) {
            return {
                selfCount,
                allCount,
                ...createPaginatedResponse(faqsDto, total, pageRequest),
            };
        }

        // If no pagination is applied, return all FAQs
        return {
            selfCount,
            allCount,
            content: faqsDto,
        };
    }

    async updateIsActive(id: number, isActive: boolean) {
        const faq = await this.faqRepository.findOne({ where: { id } });
        if (!faq) {
            throw new ResourceNotFoundException(`Common sentence with id ${id} not found`);
        }

        faq.isActive = isActive;
        return await this.faqRepository.save(faq);
    }

    async updateOwnFaqSentence(id: number, sentence: string) {
        const loggedInUser = await this.securityUtil.getLoggedInUser();
        const faq = await this.faqRepository.findOne({
            where: { id },
            relations: ['createdBy'],
        });

        if (!faq) {
            throw new ResourceNotFoundException(`Common sentence with id ${id} not found`);
        }

        // Allow only the creator to update
        if (faq.createdBy?.id !== loggedInUser.userId) {
            throw new InvalidRequestException('You are not authorized to update this Common sentence.');
        }

        faq.sentence = sentence;
        return await this.faqRepository.save(faq);
    }
}
