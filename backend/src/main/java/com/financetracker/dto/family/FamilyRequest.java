package com.financetracker.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FamilyRequest {

    @NotBlank(message = "Tên gia đình là bắt buộc")
    @Size(max = 100, message = "Tên gia đình tối đa 100 ký tự")
    private String name;

    private String description;

    @Size(min = 3, max = 3, message = "Mã tiền tệ phải đúng 3 ký tự")
    private String currency;
}
