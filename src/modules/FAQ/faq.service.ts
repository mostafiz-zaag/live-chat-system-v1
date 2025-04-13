import { Injectable } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { PageRequest } from 'src/common/dto/page-request.dto';
import { createPaginatedResponse } from 'src/common/dto/pagination.dto';
import { Role } from 'src/enums/user-role';
import { ResourceNotFoundException } from 'src/exceptions';
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
            message: 'FAQ created successfully.',
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
            return { message: 'FAQ not found.' };
        }

        // Allow only the creator to delete
        if (faq.createdBy?.id !== loggedInUser.userId) {
            return { message: 'You are not authorized to delete this FAQ.' };
        }

        await this.faqRepository.delete(id);
        return { message: 'FAQ deleted successfully.' };
    }

    async getFaqsByRole(
        role: Role,
        sentence: string,
        isActive: boolean,
        pagerequest: PageRequest,
    ) {
        const loggedInUser = await this.securityUtil.getLoggedInUser();

        const queryBuilder = this.faqRepository
            .createQueryBuilder('faq')
            .leftJoin('faq.createdBy', 'createdBy');

        FAQSpecification.matchSentence(queryBuilder, sentence);
        FAQSpecification.matchStatus(queryBuilder, isActive);
        FAQSpecification.matchRole(queryBuilder, role);
        FAQSpecification.distinctFaqs(queryBuilder);

        const [faqs, total] = await queryBuilder
            .orderBy('faq.id', 'DESC')

            .getManyAndCount();

        return createPaginatedResponse(faqs, total, pagerequest);
    }

    async getFaqsByLoggedInUser() {
        const loggedInUser = await this.securityUtil.getLoggedInUser();

        const faqs = await this.faqRepository.find({
            where: { createdBy: { id: loggedInUser.userId } },
            relations: ['createdBy'],
        });

        return instanceToPlain(faqs);
    }

    async getAdminAndOwnAgentFaqs(
        sentence: string,
        self: boolean,
        pagerequest: PageRequest,
    ) {
        const queryBuilder = this.faqRepository
            .createQueryBuilder('faq')
            .leftJoin('faq.createdBy', 'createdBy');

        const user = await this.securityUtil.getLoggedInUser();

        FAQSpecification.distinctFaqs(queryBuilder);
        FAQSpecification.matchSentence(queryBuilder, sentence);
        FAQSpecification.matchAdminOrSelf(queryBuilder, user.userId);

        if (self) {
            FAQSpecification.matchSelf(queryBuilder, user.userId);
        }

        const [faqs, total] = await queryBuilder
            .orderBy('faq.id', 'DESC')
            .getManyAndCount();

        return createPaginatedResponse(faqs, total, pagerequest);
    }

    async updateIsActive(id: number, isActive: boolean) {
        const faq = await this.faqRepository.findOne({ where: { id } });
        if (!faq) {
            throw new ResourceNotFoundException(`FAQ with id ${id} not found`);
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
            throw new ResourceNotFoundException(`FAQ with id ${id} not found`);
        }

        // Allow only the creator to update
        if (faq.createdBy?.id !== loggedInUser.userId) {
            throw new Error('You are not authorized to update this FAQ.');
        }

        faq.sentence = sentence;
        return await this.faqRepository.save(faq);
    }
}
