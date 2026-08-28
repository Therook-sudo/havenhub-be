import { Enquiry } from "../entities/Enquiry.entity";
import { Property } from "../entities/Property.entity";
import { ListingStatus } from "../entities/enums";
import { Role } from "../entities/enums";
import { User } from "../entities/User.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userModel: Repository<User>,
    @InjectRepository(Property)
    private propertyModel: Repository<Property>,
    @InjectRepository(Enquiry)
    private enquiryModel: Repository<Enquiry>,
  ) {}

  async getAdminAnalytics() {
    const [
      totalUsers,
      totalSeekers,
      totalLandlords,
      totalProperties,
      approvedProperties,
      pendingProperties,
      totalEnquiries,
    ] = await Promise.all([
      this.userModel.count(),
      this.userModel.count({
        where: { role: Role.PROPERTY_SEEKER },
      }),
      this.userModel.count({
        where: { role: Role.LANDLORD },
      }),
      this.propertyModel.count(),
      this.propertyModel.count({
        where: { status: ListingStatus.APPROVED },
      }),
      this.propertyModel.count({
        where: { status: ListingStatus.PENDING_REVIEW },
      }),
      this.enquiryModel.count(),
    ]);

    return {
      totalUsers,
      totalSeekers,
      totalLandlords,
      totalProperties,
      approvedProperties,
      pendingProperties,
      totalEnquiries,
    };
  }
}
