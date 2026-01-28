package com.financetracker.service;

import com.financetracker.dto.family.*;
import com.financetracker.entity.*;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public FamilyResponse createFamily(UUID userId, FamilyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        Family family = Family.builder()
                .name(request.getName())
                .type(request.getType() != null ? request.getType() : GroupType.FAMILY)
                .description(request.getDescription())
                .currency(request.getCurrency() != null ? request.getCurrency() : user.getDefaultCurrency())
                .createdBy(user)
                .build();

        family = familyRepository.save(family);

        // Add creator as OWNER
        FamilyMember ownerMember = FamilyMember.builder()
                .family(family)
                .user(user)
                .role(FamilyRole.OWNER)
                .joinedAt(OffsetDateTime.now())
                .build();

        familyMemberRepository.save(ownerMember);

        return toFamilyResponse(family, FamilyRole.OWNER);
    }

    public List<FamilyResponse> getMyFamilies(UUID userId) {
        List<Family> families = familyRepository.findByMemberUserId(userId);
        return families.stream()
                .map(family -> {
                    FamilyRole myRole = familyMemberRepository.findByFamilyIdAndUserId(family.getId(), userId)
                            .map(FamilyMember::getRole)
                            .orElse(null);
                    return toFamilyResponse(family, myRole);
                })
                .collect(Collectors.toList());
    }

    public FamilyResponse getFamily(UUID userId, UUID familyId) {
        Family family = familyRepository.findByIdAndMemberUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy gia đình hoặc bạn không phải thành viên", HttpStatus.NOT_FOUND));

        FamilyRole myRole = familyMemberRepository.findByFamilyIdAndUserId(familyId, userId)
                .map(FamilyMember::getRole)
                .orElse(null);

        return toFamilyResponse(family, myRole);
    }

    @Transactional
    public FamilyResponse updateFamily(UUID userId, UUID familyId, FamilyRequest request) {
        Family family = familyRepository.findByIdAndMemberUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Không tìm thấy gia đình", HttpStatus.NOT_FOUND));

        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (member.getRole() != FamilyRole.OWNER && member.getRole() != FamilyRole.ADMIN) {
            throw new ApiException("Chỉ Owner hoặc Admin mới có thể cập nhật", HttpStatus.FORBIDDEN);
        }

        family.setName(request.getName());
        if (request.getType() != null) {
            family.setType(request.getType());
        }
        family.setDescription(request.getDescription());
        if (request.getCurrency() != null) {
            family.setCurrency(request.getCurrency());
        }

        family = familyRepository.save(family);
        return toFamilyResponse(family, member.getRole());
    }

    @Transactional
    public void deleteFamily(UUID userId, UUID familyId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new ApiException("Không tìm thấy gia đình", HttpStatus.NOT_FOUND));

        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (member.getRole() != FamilyRole.OWNER) {
            throw new ApiException("Chỉ Owner mới có thể xóa gia đình", HttpStatus.FORBIDDEN);
        }

        familyRepository.delete(family);
    }

    public List<FamilyMemberResponse> getMembers(UUID userId, UUID familyId) {
        // Verify user is member
        if (!familyMemberRepository.existsByFamilyIdAndUserId(familyId, userId)) {
            throw new ApiException("Bạn không phải thành viên của gia đình này", HttpStatus.FORBIDDEN);
        }

        List<FamilyMember> members = familyMemberRepository.findByFamilyId(familyId);
        return members.stream()
                .map(this::toFamilyMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FamilyMemberResponse updateMemberRole(UUID userId, UUID familyId, UUID memberId, UpdateMemberRoleRequest request) {
        FamilyMember currentMember = familyMemberRepository.findByFamilyIdAndUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (currentMember.getRole() != FamilyRole.OWNER && currentMember.getRole() != FamilyRole.ADMIN) {
            throw new ApiException("Chỉ Owner hoặc Admin mới có thể thay đổi role", HttpStatus.FORBIDDEN);
        }

        FamilyMember targetMember = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new ApiException("Không tìm thấy thành viên", HttpStatus.NOT_FOUND));

        if (!targetMember.getFamily().getId().equals(familyId)) {
            throw new ApiException("Thành viên không thuộc gia đình này", HttpStatus.BAD_REQUEST);
        }

        // Cannot change OWNER role if you're not OWNER
        if (targetMember.getRole() == FamilyRole.OWNER && currentMember.getRole() != FamilyRole.OWNER) {
            throw new ApiException("Không thể thay đổi role của Owner", HttpStatus.FORBIDDEN);
        }

        // Cannot promote to OWNER if you're not OWNER
        if (request.getRole() == FamilyRole.OWNER && currentMember.getRole() != FamilyRole.OWNER) {
            throw new ApiException("Chỉ Owner mới có thể chuyển quyền Owner", HttpStatus.FORBIDDEN);
        }

        // If transferring OWNER role, demote current owner to ADMIN
        if (request.getRole() == FamilyRole.OWNER) {
            currentMember.setRole(FamilyRole.ADMIN);
            familyMemberRepository.save(currentMember);
        }

        targetMember.setRole(request.getRole());
        targetMember = familyMemberRepository.save(targetMember);

        return toFamilyMemberResponse(targetMember);
    }

    @Transactional
    public void removeMember(UUID userId, UUID familyId, UUID memberId) {
        FamilyMember currentMember = familyMemberRepository.findByFamilyIdAndUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (currentMember.getRole() != FamilyRole.OWNER && currentMember.getRole() != FamilyRole.ADMIN) {
            throw new ApiException("Chỉ Owner hoặc Admin mới có thể xóa thành viên", HttpStatus.FORBIDDEN);
        }

        FamilyMember targetMember = familyMemberRepository.findById(memberId)
                .orElseThrow(() -> new ApiException("Không tìm thấy thành viên", HttpStatus.NOT_FOUND));

        if (!targetMember.getFamily().getId().equals(familyId)) {
            throw new ApiException("Thành viên không thuộc gia đình này", HttpStatus.BAD_REQUEST);
        }

        if (targetMember.getRole() == FamilyRole.OWNER) {
            throw new ApiException("Không thể xóa Owner", HttpStatus.FORBIDDEN);
        }

        // ADMIN cannot remove another ADMIN
        if (currentMember.getRole() == FamilyRole.ADMIN && targetMember.getRole() == FamilyRole.ADMIN) {
            throw new ApiException("Admin không thể xóa Admin khác", HttpStatus.FORBIDDEN);
        }

        // Get info before deleting
        String removedMemberName = targetMember.getUser().getFullName();
        String familyName = targetMember.getFamily().getName();
        UUID familyIdForNotify = targetMember.getFamily().getId();

        familyMemberRepository.delete(targetMember);

        // Notify remaining members
        List<FamilyMember> remainingMembers = familyMemberRepository.findByFamilyId(familyIdForNotify);
        for (FamilyMember member : remainingMembers) {
            notificationService.notifyMemberLeft(member.getUser(), removedMemberName, familyName);
        }
    }

    @Transactional
    public void leaveFamily(UUID userId, UUID familyId) {
        FamilyMember member = familyMemberRepository.findByFamilyIdAndUserId(familyId, userId)
                .orElseThrow(() -> new ApiException("Bạn không phải thành viên", HttpStatus.FORBIDDEN));

        if (member.getRole() == FamilyRole.OWNER) {
            throw new ApiException("Owner không thể rời gia đình. Hãy chuyển quyền Owner trước.", HttpStatus.FORBIDDEN);
        }

        // Get info before deleting
        String leavingMemberName = member.getUser().getFullName();
        String familyName = member.getFamily().getName();

        familyMemberRepository.delete(member);

        // Notify remaining members
        List<FamilyMember> remainingMembers = familyMemberRepository.findByFamilyId(familyId);
        for (FamilyMember remainingMember : remainingMembers) {
            notificationService.notifyMemberLeft(remainingMember.getUser(), leavingMemberName, familyName);
        }
    }

    private FamilyResponse toFamilyResponse(Family family, FamilyRole myRole) {
        return FamilyResponse.builder()
                .id(family.getId())
                .name(family.getName())
                .type(family.getType())
                .description(family.getDescription())
                .currency(family.getCurrency())
                .createdById(family.getCreatedBy().getId())
                .createdByName(family.getCreatedBy().getFullName())
                .memberCount(family.getMembers().size())
                .myRole(myRole)
                .createdAt(family.getCreatedAt())
                .build();
    }

    private FamilyMemberResponse toFamilyMemberResponse(FamilyMember member) {
        return FamilyMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .email(member.getUser().getEmail())
                .fullName(member.getUser().getFullName())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
