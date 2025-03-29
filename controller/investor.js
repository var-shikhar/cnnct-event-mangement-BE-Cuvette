// import { db } from "../middleware/db.js";
// import RouteCode from "../util/httpStatus.js";
// import { getReqUser } from "../util/reqUser.js";


// // Retrieve User's List
// const getInvestorList = async (req, res, next) => {
//     const profileStatus = String(req.query.query).toLowerCase() || 'All';
//     const reqPage = Number(req.query.page) || 1;
//     const reqLimit = Number(req.query.limit) || 15;
//     const reqOffset = (reqPage - 1) * reqLimit;

//     const countQuery = `SELECT COUNT(*) AS count
//                         FROM investor_profile invP
//                         LEFT JOIN user ON invP.investor_id = user.user_id
//                         WHERE (? = 'All' OR ? IS NULL OR user.profile_status = ?)`;
//     const dataQuery = `
//                     SELECT
//                         ip.id,
//                         ip.investor_id as investorID,
//                         ip.investing_firm_name as investorFirmName,
//                         ip.investing_firm_bio as investorBio,
//                         ip.invested_before as investedBefore,
//                         invType.id as invTypeID,
//                         invType.typeName as invTypeName,
//                         ip.websiteURL,
//                         ip.address,
//                         city.id as cityID,
//                         city.city_name as cityName,
//                         state.id as stateID,
//                         state.state_name as stateName,
//                         district.id as districtID,
//                         district.district_name as districtName,
//                         ip.zip,
//                         ip.preferred_sectors,
//                         ip.preferred_investment_stage,
//                         ip.investment_commitment,
//                         ip.engagement,
//                         ip.preferredBusinessModal,
//                         ip.preferredIndustry,
//                         ip.profile_created_on as joinedAt,
//                         user.isBlocked,
//                         user.isActive,
//                         user.isArchived,
//                         LPAD(user.user_id, 6, '0') as registrationID,
//                         user_roles.role_code,
//                         user.profile_status as profileStatus,
//                         user.profile_status_updated_at as profileStatusUpdatedAt
//                     FROM investor_profile ip
//                     LEFT JOIN user ON ip.investor_id = user.user_id
//                     LEFT JOIN user_roles ON user.user_type_id = user_roles.id
//                     LEFT JOIN investor_type invType ON ip.investorType = invType.id
//                     LEFT JOIN city ON ip.city_id = city.id
//                     LEFT JOIN state ON ip.state_id = state.id
//                     LEFT JOIN district ON ip.districtID = district.id
//                     WHERE (? = 'All' OR ? IS NULL OR user.profile_status = ?)
//                     ORDER BY ip.investing_firm_name ASC
//                     LIMIT ${reqLimit} OFFSET ${reqOffset} `;

//     try {
//         const [{ count: totalCount }] = await db(countQuery, [profileStatus, profileStatus, profileStatus]);
//         const investorList = await db(dataQuery, [profileStatus, profileStatus, profileStatus]);

//         const finalList = investorList.map(item => {
//             return {
//                 ...item,
//                 registrationID: `${item.role_code}-${item.registrationID}`,
//             }
//         })
//         res.status(RouteCode.SUCCESS.statusCode).json({
//             results: finalList,
//             hasNextPage: reqOffset + reqLimit < totalCount,
//         });
//     } catch (error) {
//         console.error('Error fetching Investor list:', error);
//         next(error);
//     }
// };
// // Retrieve User's Detail
// const getInvestorDetailByID = async (req, res, next) => {
//     const { investorID } = req.params;
//     const dataQuery = `
//                     SELECT
//                         invP.id,
//                         invP.investor_id as investorID,
//                         invP.investing_firm_name as investorFirmName,
//                         invP.investing_firm_logo as profileImage,
//                         invP.investing_firm_bio as investorBio,
//                         invP.invested_before as investedBefore,
//                         invType.typeName as invTypeName,
//                         invP.websiteURL,
//                         invP.address,
//                         city.city_name as cityName,
//                         state.state_name as stateName,
//                         district.district_name as districtName,
//                         invP.zip,
//                         invP.isSecAddressSimilartoPrimary,
//                         invP.secAddress,
//                         invP.secZipID as secondaryZip,
//                         scity.city_name as secondaryCity,
//                         sstate.state_name as secondaryState,
//                         sdistrict.district_name as secondaryDistrict,
//                         invP.preferred_sectors,
//                         invP.preferred_investment_stage,
//                         invP.investment_commitment,
//                         invP.engagement,
//                         invP.preferredBusinessModal,
//                         invP.preferredIndustry,
//                         invP.investmentTeam,
//                         user_roles.role_name,
//                         user_roles.role_code,
//                         user.user_email,
//                         user.user_contact_no,
//                         LPAD(user.user_id, 6, '0') as registrationID,
//                         user.socialTwitter,
//                         user.socialLinkedIn,
//                         user.socialFacebook,
//                         user.socialInstagram,
//                         user.profile_status as profileStatus
//                     FROM investor_profile invP
//                     LEFT JOIN user ON invP.investor_id = user.user_id
//                     LEFT JOIN user_roles ON user.user_type_id = user_roles.id
//                     LEFT JOIN investor_type invType ON invP.investorType = invType.id
//                     LEFT JOIN city ON invP.city_id = city.id
//                     LEFT JOIN state ON invP.state_id = state.id
//                     LEFT JOIN district ON invP.districtID = district.id
//                     LEFT JOIN city scity ON invP.secCityID = scity.id
//                     LEFT JOIN state sstate ON invP.secStateID = sstate.id
//                     LEFT JOIN district sdistrict ON invP.secDistrictID = sdistrict.id
//                     WHERE invP.investor_id = ?
//                     GROUP BY invP.investor_id
//                     ORDER BY user.user_name ASC`;

//     const fetchLogQuery = `SELECT
//                                 log.id,
//                                 log.previous_status,
//                                 log.new_status,
//                                 log.updateDate,
//                                 log.message,
//                                 actionUser.user_name
//                             FROM investor_profile invP
//                             LEFT JOIN user ON invP.investor_id = user.user_id
//                             INNER JOIN user_profile_status_log log ON user.uuid = log.userID
//                             LEFT JOIN user actionUser ON log.updatedBy = actionUser.uuid
//                             WHERE user.user_id = ?
//                             ORDER BY log.updateDate DESC`;

//     if (!investorID) {
//         return next(new CustomError("Investor ID is required!", RouteCode.BAD_REQUEST.statusCode));
//     }
//     try {
//         const [data] = await db(dataQuery, [investorID]);
//         const logData = await db(fetchLogQuery, [investorID]);

//         if (!data) {
//             return next(new CustomError("Investor not found!", RouteCode.NOT_FOUND.statusCode));
//         }

//         const finalOBJ = {
//             userDetails: {
//                 investorID: data.investorID ?? 'N/A',
//                 investorName: data.investorFirmName ?? 'N/A',
//                 investorEmail: data.user_email ?? 'N/A',
//                 investorContact: data.user_contact_no ?? 'N/A',
//                 registrationID: `${data.role_code}-${data.registrationID}` ?? 'N/A',
//                 roleName: data.role_name,
//             },
//             investorProfile: {
//                 logo: data.profileImage,
//                 bio: data.investorBio ?? 'N/A',
//                 investedBefore: data.investedBefore,
//                 investorTypeName: data.invTypeName,
//                 websiteURL: data.websiteURL ?? 'N/A',

//                 preferredIndustry: data.preferredIndustry?.map(item => item.industry_name).join(', ') ?? [],
//                 preferredBusinessModal: data.preferredBusinessModal?.map(item => item.modelName).join(', ') ?? [],
//                 preferredSectors: data.preferred_sectors?.map(item => item.sector_name).join(', ') ?? [],
//                 preferredInvestmentStage: data.preferred_investment_stage?.map(item => item.startup_stage_name).join(', ') ?? [],
//                 investmentCommitment: data.investment_commitment?.map(item => item.commitment_name).join(', ') ?? [],
//                 engagements: data.engagement?.map(item => item.engagement_mode_name).join(', ') ?? [],
//                 profileStatus: data.profileStatus,
//             },
//             address: {
//                 address: data.address ?? 'N/A',
//                 primaryCity: data.cityName ?? 'N/A',
//                 primaryDistrict: data.districtName ?? 'N/A',
//                 primaryState: data.stateName ?? 'N/A',
//                 zip: data.zip ?? 'N/A',

//                 secAddSimilarToPrimary: data.isSecAddressSimilartoPrimary ? 'Yes' : 'No',
//                 secAddress: data.secAddress ?? 'N/A',
//                 secondaryCity: data.secondaryCity ?? 'N/A',
//                 secondaryDistrict: data.secondaryDistrict ?? 'N/A',
//                 secondaryState: data.secondaryState ?? 'N/A',
//                 secZip: data.secondaryZip ?? 'N/A',
//                 socialTwitter: data.socialTwitter,
//                 socialLinkedIn: data.socialLinkedIn,
//                 socialInstagram: data.socialInstagram,
//                 socialFacebook: data.socialFacebook,
//             },
//             members: {
//                 team: data.investmentTeam?.map(item => {
//                     return {
//                         repName: item.repName,
//                         repEmail: item.repEmail,
//                         repGender: item.repGender,
//                         repLinkedIn: item.repLinkedIn,
//                         repDesignation: item.repDesignation,
//                     }
//                 }) ?? [],
//             },
//             logDetails: {
//                 log: logData ?? [],
//             },
//         }

//         res.status(RouteCode.SUCCESS.statusCode).json(finalOBJ);
//     } catch (error) {
//         console.error('Error fetching Investor list:', error);
//         next(error);
//     }
// };
// // Update User's Approval Request Status
// const patchInvestorStatus = async (req, res, next) => {
//     const { id, newStatus, message } = req.body;
//     if (!id || !newStatus) {
//         return next(new CustomError("Something went wrong, Try again!", RouteCode.BAD_REQUEST.statusCode));
//     }

//     const findQuery = 'SELECT * FROM user JOIN investor_profile ON user.user_id = investor_profile.investor_id WHERE user_id = ?';
//     const logInsertionQuery = 'INSERT INTO user_profile_status_log (userID, previous_status, new_status, updateDate, updatedBy, message) VALUES (?, ?, ?, ?, ?, ?)';
//     const updateUserQuery = 'UPDATE user SET profile_status = ?, profile_status_updated_at = ? WHERE uuid = ?';

//     try {
//         const reqUser = await getReqUser(req, next);
//         const [foundInvestor] = await db(findQuery, [id]);

//         if (!foundInvestor) {
//             return next(new CustomError("Investor not found, Try again later.", RouteCode.NOT_FOUND.statusCode));
//         }

//         const isValidStatus = true
//         if (!isValidStatus) {
//             return next(new CustomError("Something went wrong, Try again!", RouteCode.BAD_REQUEST.statusCode));
//         }


//         await db(logInsertionQuery, [foundInvestor.uuid, foundInvestor.profile_status, newStatus, new Date(), reqUser.uuid, message])
//         await db(updateUserQuery, [newStatus, new Date(), foundInvestor.uuid]);

//         return res.status(RouteCode.SUCCESS.statusCode).json({ message: `Status updated successfully` });
//     } catch (error) {
//         next(error);
//     }
// };

// const deleteInvestor = async (req, res, next) => {
//     const { investorID } = req.params;

//     if (!investorID) {
//         return res.status(RouteCode.BAD_REQUEST.statusCode).json({ message: 'Something went wrong, Try later!' });
//     }
//     try {
//         const [foundInvestor] = await db('SELECT id, investor_id FROM investor_profile WHERE id = ?', [investorID])
//         if (!foundInvestor.id || !foundInvestor.investor_id) {
//             return res.status(RouteCode.BAD_REQUEST.statusCode).json({ message: `Something went wrong, Try later!` });
//         }

//         // const { isUsed, columnName, tableName } = await checkReferences(investorID, 'investor_profile');
//         // if (isUsed) {
//         //     return res.status(RouteCode.CONFLICT.statusCode).json({
//         //         message: `Cannot delete: Investor is in use elsewhere!`,
//         //     });
//         // }
//         // Delete Investor Profile
//         await db('DELETE FROM investor_profile WHERE id = ?', [orgID]);

//         // Find and Delete Existing Investor (in User Table)
//         // const { isUsed: incUserUsed } = await checkReferences(foundInvestor.orgID, 'user');
//         // if (incUserUsed) {
//         //     return res.status(RouteCode.CONFLICT.statusCode).json({
//         //         message: `Cannot delete: Investor is in use elsewhere!`,
//         //     });
//         // }

//         await db('DELETE FROM user WHERE user_id = ?', [foundInvestor.orgID]);

//         res.status(RouteCode.SUCCESS.statusCode).json({ message: `Investor has deleted successfully.` });
//     } catch (error) {
//         next(error);
//     }
// };


// export default {
//     getInvestorList, patchInvestorStatus, deleteInvestor, getInvestorDetailByID
// }