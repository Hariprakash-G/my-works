/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import CameraPage from '@/components/CameraController';
import DropdownComponent from '@/components/DropdownOption';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
  Pressable,
  Clipboard,
  StyleSheet,
} from 'react-native';
import { AtaiStore } from '@atai/react-native';
import { Checkbox, RadioButton, TextInput } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/Colors';
import { AtaiTranslatable, AxiosClient } from '@atai/react-native';
import { ApiRoutes } from '@/constants/ApiRoutes';
import { getUploadFileName, useToaster, isPropEmpty, useRoleCheck } from '@/utils/CommonUtils';
import { SvgXml } from 'react-native-svg';
import { captureWhite, dummyImage, qrCodeIcon } from '@/constants/AttributesSvgs';
import ImagePreview from '@/components/ImagePreview';
import SwitchToggle from "react-native-switch-toggle";
import ConfirmationDialog, { ConfirmationDialogData } from '@/components/CommonConfirmationDialog';
import { DateTimeMode } from '@/components/form-wrapper/typings';
import { SurveyType } from '@/assets/environment';
import { DatePickerInput } from 'react-native-paper-dates';
import { useLogs } from '@/utils/logs-store-wrapper';
import { GateFeatureAccessibleRoles } from '@/constants/RolesTypings';

function FactoryInput({
  attributes,
  onInputOut,
  onFocus,
  Focused, style
}: {
  attributes: Omit<Field<null>, 'sub_fields'> & {
    inputType?: 'number' | 'name' | 'float';
    uppercase?: boolean;
    is_negative?: boolean;
    regex?: any
    maxlength?: number
  };
  onInputOut?: (
    arg: FactoryFieldOutPut<FieldType.INPUT> | undefined,
  ) => void | undefined;
  onFocus?: () => void;
  Focused?: boolean;
  style?: { background?: string, border?: string, borderWidth?: number, textColor?: string }
}) {
  const inputRef = useRef<any>(null);
  const [getvalue, setValue] = useState<string>('');
  const setMessage = AtaiStore((state) => state.setToasterMessage);
  const doCopy = (text: string) => {
    if (!text) return;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else if (Clipboard && Clipboard.setString) {
      Clipboard.setString(text);
    }
    setMessage({ type: "INFO", message: "Copied to clipboard" });
  };
  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus();
    }
  }, [Focused]);
  function handleChangeText(text: string) {   //NOSONAR
    let filteredText =
      attributes.uppercase && Platform.OS === 'web' ? text.toUpperCase() : text;

    if (attributes?.regex) {
      // Use the regex for the current length (step-by-step validation)
      const regex = attributes.regex[filteredText.length - 1];

      // Step validation: only check if regex exists for this length
      const stepValid = regex ? regex.test(filteredText) : true;

      // Full validation: only if pasted input matches full length
      const fullValid =
        filteredText.length === attributes.regex.length &&
        attributes.regex[attributes.regex.length - 1].test(filteredText);

      // If not valid at this step and not valid as full, block input
      if (filteredText !== '') {
        // Allow input if no regex exists for this length
        if (text.length < getvalue?.length) {
        } else {
          if (regex && !stepValid && !fullValid) {
            return; // Invalid input
          }
        }
      }
    } else {
      if (attributes.inputType === 'number') {
        if (attributes?.is_negative) {
          filteredText = text.replace(/(?!^-)\D/g, '');
        } else {
          filteredText = text.replace(/\D/g, '');
        }
      } else if (attributes.inputType === 'float') {
        if (attributes?.is_negative) {
          filteredText = text.replace(/(?!^-)[^0-9.]/g, '');
        } else {
          filteredText = text.replace(/[^0-9.]/g, '');
        }

        filteredText =
          filteredText.split('.').length > 2
            ? filteredText.replace(/\.+$/, '')
            : filteredText;
      } else {
        filteredText = filteredText.replace(/[^a-zA-Z0-9.]/g, '');
      }
    }
    if (attributes?.maxlength && filteredText.length > attributes.maxlength) {
      return
    }
    const out: FactoryFieldOutPut<FieldType.INPUT> = {
      value: filteredText,
      field_name: attributes?.field_name ?? '',
    };

    if (onInputOut) {
      onInputOut(out);
    }

    setValue(filteredText);
  }

  useEffect(() => {
    setValue(attributes?.value ?? '');

    onInputOut &&
      onInputOut({
        value: (attributes?.value as string),
        field_name: attributes?.field_name ?? '',
      });
  }, [attributes?.value]);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <TextInput
        mode="flat"
        cursorColor={colors.success}
        textColor={style?.textColor ?? colors.text_primary_dark}
        activeOutlineColor={colors.success}
        activeUnderlineColor="transparent"
        theme={{ colors: { placeholder: colors.ternary } }}
        keyboardType={
          Platform.OS === 'web'
            ? 'default'
            : attributes.inputType === 'number'   //NOSONAR
              ? 'numeric'
              : 'default'
        } // Numeric keyboard for native
        autoCapitalize={attributes.uppercase ? 'characters' : 'none'}
        textContentType={'none'}
        dense={true}
        value={getvalue}
        underlineColor="transparent"
        onChangeText={handleChangeText}
        editable={attributes?.is_editable}
        placeholder={attributes?.place_holder}
        placeholderTextColor={colors.primary_placeholder_light}
        style={[
          {
            fontSize: 16,
            backgroundColor: style?.background ?? colors.ternary_light,
            borderColor: isFocused
              ? style?.border ?? colors.text_secondary_dark
              : style?.border ?? colors.primary_input_field_light,
            borderWidth: style?.borderWidth ?? 1,
            borderRadius: 5,
            flexGrow: 1,
          },
          attributes?.is_editable === false && {
            backgroundColor: style?.background ?? colors.primary_input_field_light,
            color: colors.text_secondary_dark,
            opacity: 0.8,
            borderWidth: style?.borderWidth ?? 0,
            borderRadius: 5,
          },
        ]}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();           // ← fire parent’s handler
        }}
        onBlur={() => setIsFocused(false)}
      />
      {attributes?.isCopy && (
        <Pressable
          onPress={() => { doCopy(getvalue); }}
          style={styles.copyIcon}
        >
          <FontAwesome6
            name="copy"
            size={18}
            color={
              SurveyType === 'multiPage' ? colors.text_primary_dark : colors.text_primary
            }
          />
        </Pressable>
      )}
    </View>
  );
}
function FactoryTextArea({
  attributes,
  onInputOut,
  style
}: {
  attributes: Omit<Field<null>, 'sub_fields'> & {
    inputType?: 'number' | 'name' | 'float';
    uppercase?: boolean;
    is_negative?: boolean;
    regex?: any
    maxlength?: number
  };
  onInputOut?: (
    arg: FactoryFieldOutPut<FieldType.INPUT> | undefined,
  ) => void | undefined;
  style?: { background?: string, border?: string, borderWidth?: number, textColor?: string }
}) {
  const [getvalue, setValue] = useState<string>('');

  function handleChangeText(text: string) {   //NOSONAR
    let filteredText =
      attributes.uppercase && Platform.OS === 'web' ? text.toUpperCase() : text;

    if (attributes?.regex) {

      const regex = attributes.regex[filteredText.length - 1];

      // First, check step-by-step regex if length matches
      const stepValid = regex?.test(filteredText);

      // Then, fallback to final full check if pasted input length is valid (e.g., 11 chars)
      const fullValid =
        filteredText.length === attributes.regex.length &&
        attributes.regex[attributes.regex.length - 1].test(filteredText);
      if (filteredText !== '') {

        if (!stepValid && !fullValid) {
          return; // Invalid input
        }
      }
    } else {
      if (attributes.inputType === 'number') {
        if (attributes?.is_negative) {
          filteredText = text.replace(/(?!^-)\D/g, '');
        } else {
          filteredText = text.replace(/\D/g, '');
        }
      } else if (attributes.inputType === 'float') {
        if (attributes?.is_negative) {
          filteredText = text.replace(/(?!^-)[^0-9.]/g, '');
        } else {
          filteredText = text.replace(/[^0-9.]/g, '');
        }

        filteredText =
          filteredText.split('.').length > 2
            ? filteredText.replace(/\.+$/, '')
            : filteredText;
      } else {
        filteredText = filteredText.replace(/[^a-zA-Z0-9. ]/g, '');
      }
    }
    const out: FactoryFieldOutPut<FieldType.INPUT> = {
      value: filteredText,
      field_name: attributes?.field_name ?? '',
    };

    if (onInputOut) {
      onInputOut(out);
    }

    setValue(filteredText);
  }

  useEffect(() => {
    setValue(attributes?.value ?? '');

    onInputOut &&
      onInputOut({
        value: (attributes?.value as string),
        field_name: attributes?.field_name ?? '',
      });
  }, [attributes?.value]);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ width: '100%' }}>
      <TextInput
        cursorColor={colors.success}
        multiline // REQUIRED for text area
        dense={false}
        value={getvalue}
        onChangeText={handleChangeText}
        editable={attributes?.is_editable}
        placeholder={attributes?.place_holder}
        placeholderTextColor={colors.primary_placeholder_light}
        textColor={colors.text_primary_dark}
        activeOutlineColor={colors.success}
        theme={{ colors: { placeholder: colors.ternary } }}
        keyboardType={'default'}
        underlineColor="transparent"
        activeUnderlineColor="transparent"

        style={{
          height: 100,
          backgroundColor: colors.primary_light,
          borderColor: isFocused
            ? colors.text_secondary_dark
            : colors.primary_input_field_light,
          borderWidth: 1,
          borderRadius: 5,
        }}
        contentStyle={{
          paddingTop: Platform.OS === 'ios' ? 8 : 6,
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingLeft: 10,
          paddingRight: 10,
          textAlignVertical: 'top',
          fontSize: 16,
          fontFamily: 'Inter_400Regular',
          letterSpacing: 0.15,
          lineHeight: 16 * 1.2,
          color: colors.text_primary_dark,
        }}

        maxLength={attributes?.maxlength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
        <Text style={{
          fontSize: 12,
          color: '#6B7280',
          fontFamily: 'Inter_400Regular',
        }}>
          {getvalue?.length || 0}{attributes?.maxlength ? `/${attributes?.maxlength}` : ""}
        </Text>
      </View>
    </View>
  );
}
function FactoryCheckBox({
  attributes,
  direction = 'row',
  onCheckBoxOut,
}: {
  attributes: Field<SubField<{ isChecked?: boolean }>> | null;
  direction: 'row' | 'column';
  onCheckBoxOut?: (
    arg: FactoryFieldOutPut<FieldType.CHECKBOX> | undefined,
  ) => void | undefined;
}) {
  const [getAttributes, seAttributes] = useState<typeof attributes>();
  useEffect(() => {
    seAttributes(attributes);
  }, []);

  const onCheck = useCallback(
    (i: number) => {
      if (getAttributes?.sub_fields?.[i]) {
        const updatedSubFields = [...(getAttributes.sub_fields || [])];
        updatedSubFields[i].isChecked = !updatedSubFields[i].isChecked;

        seAttributes({
          ...getAttributes,
          sub_fields: updatedSubFields,
        });

        const outPut: FactoryFieldOutPut<FieldType.CHECKBOX> = {
          value: [...getAttributes.sub_fields?.filter((d) => d.isChecked)],
          field_name: getAttributes?.field_name ?? '',
        };
        if (onCheckBoxOut) {
          onCheckBoxOut(outPut);
        }
      }
    },
    [getAttributes, onCheckBoxOut],
  );

  return (
    <View>
      <Text className="text-xl" style={{ fontFamily: 'Inter_500Medium' }}>
        {getAttributes?.display_name}
      </Text>

      <FlatList
        data={getAttributes?.sub_fields}
        contentContainerStyle={{
          display: 'flex',
          gap: 10,
          flexDirection: direction,
        }}
        renderItem={(i) => {
          return (
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular' }}>
                {i?.item?.label}
              </Text>

              <Checkbox
                onPress={() => {
                  onCheck(i?.index);
                }}
                key={i?.index}
                status={!i?.item?.isChecked ? 'unchecked' : 'checked'}
              ></Checkbox>
            </View>
          );
        }}
      />
    </View>
  );
}

function FactoryRadioGroup({
  attributes,
  onRadioGroupOut,
  direction = 'row',
  initialValue = '',
}: {
  attributes: Field<SubField<unknown>> | null;
  onRadioGroupOut?: (
    arg: FactoryFieldOutPut<FieldType.RADIO> | undefined,
  ) => void | undefined;
  direction?: 'row' | 'column';
  initialValue?: string;
}) {
  const [getvalue, setValue] = useState<string | any>('');

  useEffect(() => {
    if (!isPropEmpty(initialValue)) {
      setValue(+initialValue);

      const out: FactoryFieldOutPut<FieldType.RADIO> = {
        value: initialValue,
        field_name: attributes?.field_name ?? '',
      };
      if (onRadioGroupOut) onRadioGroupOut(out);
    }
  }, [initialValue]);

  return (
    <View>
      <RadioButton.Group
        onValueChange={(newValue) => {
          setValue(newValue);
          const out: FactoryFieldOutPut<FieldType.RADIO> = {
            value: newValue,
            field_name: attributes?.field_name ?? '',
          };
          if (onRadioGroupOut) onRadioGroupOut(out);
        }}
        value={getvalue}
      >
        <FlatList
          contentContainerStyle={{
            display: 'flex',
            flexDirection: direction ?? 'row',
            flexWrap: "wrap",
            gap: 15,
            justifyContent: attributes?.sub_fields?.length === 2 ? 'space-between' : "flex-start",
          }}
          data={attributes?.sub_fields}
          renderItem={(i) => {
            return (
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}
              >
                <RadioButton
                  color={colors.success}
                  value={i?.item?.value as string}
                />
                <AtaiTranslatable
                  Component={Text}
                  style={{
                    fontFamily: "Inter_400Regular",
                    color: SurveyType === "SinglePage" ? colors.text_primary_light : colors.text_primary_dark,
                  }}
                >
                  {i?.item?.label}
                </AtaiTranslatable>
              </View>
            );
          }}
        />
      </RadioButton.Group>
    </View>
  );
}

function FactoryOptions({
  attributes,
  onOptionsOut,
  initialValue,
}: {
  attributes: Field<SubField<unknown>> | null;
  onOptionsOut?: (
    arg: FactoryFieldOutPut<FieldType.OPTION> | undefined,
  ) => void | undefined;
  initialValue?: number;
}) {
  return (
    <DropdownComponent
      onValueOut={(d) => {
        const out: any = {
          value: d.value,
          field_name: attributes?.field_name ?? '',
        };

        if (onOptionsOut) onOptionsOut(out);
      }}
      isEditable={attributes?.is_editable ?? true}
      placeHolder={attributes?.place_holder ?? ''}
      label={attributes?.display_name ?? ''}
      data={attributes?.sub_fields ?? []}
      initialVal={initialValue}
    ></DropdownComponent>
  );
}

function FactoryCapture({
  attributes,
  onCaptureOut,
}: {
  attributes: {
    imgName?: string;
    field_name: string;
    multi: boolean;
    src?: string;
    isEditable?: boolean;
    allImages?: any
  };
  onCaptureOut: (
    arg: FactoryFieldOutPut<FieldType.CAPTURE> | undefined,
  ) => void | undefined;
}) {
  const [openCamera, setOpenCamera] = useState<boolean>(false);
  const [camImg, setCamImg] = useState<string>();
  const [previewUri, setPreviewUri] = useState<string | null>();
  const [ConfirmationDialogData, setConfirmationDialogData] = useState<ConfirmationDialogData | null>();
  const { initToaster } = useToaster()
  const { hasPermission } = useRoleCheck();
  const is_media_service_enabled = hasPermission(GateFeatureAccessibleRoles.MEDIA_SERVICE_ENABLED);
  function onCameraOut(data: any) {
    setOpenCamera(false);
    onCaptureOut(data);
  }

  async function onImageDelete() {
    try {
      const res = await AxiosClient.request().delete(is_media_service_enabled ? ApiRoutes.imgMediserdelete : ApiRoutes.imgDelete, {
        params: {
          file_url: attributes?.src ?? '',
        },
      });
      setOpenCamera(false);
      onCameraOut({
        src: '',
        field_name: '',
      });
      if (res) {
        setConfirmationDialogData(null)
      }

    } catch (error) {
      onCameraOut({
        src: '',
        field_name: '',
      });
      console.error('Error Deleting image:', error);
      setConfirmationDialogData(null)
    }
  }

  async function uploadImage(formData: FormData, filename: string, resImage: any) {
    try {
      if (is_media_service_enabled) {
        const newPayload = {
          app_name: "ATGATE",
          module_name: "SURVEY_APP",
          folder_path: "survey",
        };

        formData.append("payload", JSON.stringify(newPayload));
      }
      setOpenCamera(false);
      const res = await AxiosClient.request().post(
        is_media_service_enabled ? ApiRoutes.imgMediserUpload : ApiRoutes.imgUpload,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // params: {
          //   filename:filename, // Pass fileName as param if needed
          // },
        },
      );
      const result = await res.data;
      if (res?.status === 200) {
        useLogs.add(
          Date.now(),
          "Image Upload",
          "Image Upload Successful",
          result,
          undefined,
          Date.now()
        );
      }
      setCamImg(resImage);

      onCaptureOut({
        src: result?.file_upload_url,
        field_name: attributes?.field_name ?? '',
      });
      return result?.file_upload_url;
    } catch (error: any) {
      const status = (error)?.response?.status ?? (error)?.status ?? error?.message ?? error?.code;
      initToaster('FAILURE', `Image upload failed (${status})`);
      setCamImg('');
      onCaptureOut({
        src: '',
        field_name: '',
      });      
      useLogs.add(
        Date.now(),
        "Image Upload",
        "Image Upload Failed",
        error,
        undefined,
        Date.now(),
      );
    }
  }

  const uriToBlob = async (uri: any) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCamImg("retry");

      const formData = new FormData();
      const imageBlob = await uriToBlob(result?.assets?.[0]?.uri);
      formData.append('file', imageBlob, await getUploadFileName(attributes?.imgName ?? Math.floor(Date.now() / 1000).toString(), result.assets[0].uri));
      useLogs.add(
        Date.now(),
        "Image Upload",
        "Image Upload started",
        {},
        Date.now(),
      );
      await uploadImage(formData, await getUploadFileName(attributes?.imgName ?? Math.floor(Date.now() / 1000).toString(), result.assets[0].uri), result.assets[0].uri);
    }
  }
  function handleDialogSubmit() {
    onImageDelete()
  }
  useEffect(() => {
    if (attributes?.src) {
      setCamImg(attributes.src);
    }
  }, []);

  useEffect(() => {
    setCamImg(attributes?.src);
    onCaptureOut({
      src: attributes.src ?? '',
      field_name: attributes?.field_name ?? '',
    });
  }, [attributes?.src]);
  const getImageSource = () => {
    if (camImg === 'retry') {
      return require('@assets/images/loader.gif');
    }
    else if (camImg === 'N/A') {
      return require('@assets/images/broken_img.png');
    }
    return { uri: camImg };
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 5,
        // width: '98%',
        justifyContent: 'space-between',
      }}
    >
      {openCamera && attributes?.isEditable && (
        <CameraPage
          imgName={attributes?.imgName ?? ''}
          multi={attributes?.multi}
          onCameraOut={onCameraOut}
          closeCamera={() => { setOpenCamera(false) }}
        />
      )}

      <View>
        {!camImg ? (
          <TouchableOpacity
            style={{
              height: 65,
              width: 65,
              paddingBottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 7,
              backgroundColor: SurveyType === "multiPage" ? colors.primary_light : "#F9F9F90F",
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 9,
              elevation: 9,
            }}
            onPress={() =>
              Platform.OS === 'web' ? pickImage() : setOpenCamera(true)
            }
          >
            <SvgXml
              onError={(e) => console.error('error rendering svg image', e)}
              id="1"
              style={{
                width: 32,
                height: 32,
              }}
              xml={SurveyType === "multiPage" ? dummyImage : captureWhite}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ position: 'relative' }}>
            {!isPropEmpty(previewUri) && (
              <ImagePreview
                closeModal={() => setPreviewUri(null)}
                imageUri={previewUri as string}
                allImages={attributes?.allImages}
              />
            )}

            <TouchableOpacity onPress={() => setPreviewUri(camImg)}>
              <Image
                resizeMode="contain"
                style={{ width: 50, height: 50 }}
                defaultSource={require('@assets/images/broken_img.png')}
                source={getImageSource()}
              />
            </TouchableOpacity>

            {attributes?.isEditable && (
              <TouchableOpacity
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 50,
                  backgroundColor: 'red',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  top: -5,
                  right: -23,
                }}
                onPress={() => {
                  setConfirmationDialogData({
                    form: "DelSurveyData",
                    header: 'Confirmation Message',
                    backButtonText: 'Cancel',
                    submitButtontext: 'Ok',
                    bodyValue: 'Are you sure you want to delete the Image ?',
                    isAnyicon: false,
                    iconsrc: '',
                    sharedValue: ""
                  })
                }}
              >
                <AntDesign name="delete" size={12} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {!isPropEmpty(ConfirmationDialogData) && (
        <ConfirmationDialog
          closeModal={() => setConfirmationDialogData(null)}
          value={ConfirmationDialogData}
          submitClicked={handleDialogSubmit}
        />
      )}
    </View>
  );
}

function FactoryInputCapture({
  attributes,
  onInputOut,
  onCaptureOut,
  style
}: {
  attributes: Omit<Field<null>, 'sub_fields'> & {
    multi?: boolean;
    src?: string;
    inputType?: 'number' | 'name' | 'float';
    is_negative?: boolean;
    OCREnabled?: boolean;
    isQRScanner?: boolean,
    imgName?: string;
    uppercase?: boolean;
    regex?: any
    maxlength?: number;
    isImageEditable?: boolean
  };
  style?: { background?: string, border?: string, borderWidth?: number, textColor?: string }
  onInputOut: (
    arg: FactoryFieldOutPut<FieldType.INPUT> | undefined,
  ) => void | undefined;
  onCaptureOut: (
    arg: FactoryFieldOutPut<FieldType.INPUT_CAPTURE> | undefined,
  ) => void | undefined;
}) {
  const [openCamera, setOpenCamera] = useState<boolean>(false);
  const [camImg, setCamImg] = useState<string>();
  const [getValue, setValue] = useState<string>('');
  const [previewUri, setPreviewUri] = useState<string | null>();
  const [ConfirmationDialogData, setConfirmationDialogData] = useState<ConfirmationDialogData | null>();
  const { initToaster } = useToaster();
  const { hasPermission } = useRoleCheck();
  const is_media_service_enabled = hasPermission(GateFeatureAccessibleRoles.MEDIA_SERVICE_ENABLED);
  const [workAround, setWorkAround] = useState(false);
  function onCameraOut(data: any) {
    setOpenCamera(false);
    onCaptureOut(data);
    if (attributes?.OCREnabled) {
      useLogs.add(
        Date.now(),
        "Seal Capture End",
        "Seal Capture ended",
        data,
        undefined,
        Date.now()
      );
    }
  }

  const setOpenCameraTrue = (() => {
    Platform.OS === 'web' ? pickImage() : setOpenCamera(true);
    setWorkAround((prev) => !prev)
  })

  async function uploadImage(formData: FormData, filename: string, resulimg: any) {   //NOSONAR
    if (!attributes?.isQRScanner) {
      try {
        if (is_media_service_enabled) {
          const newPayload = {
            app_name: "ATGATE",
            module_name: "SURVEY_APP",
            folder_path: "survey",
          };

          formData.append("payload", JSON.stringify(newPayload));
        }
        const res = await AxiosClient.request().post(
          is_media_service_enabled ? ApiRoutes.imgMediserUpload : ApiRoutes.imgUpload,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            params: {
              filename: filename, // Pass fileName as param if needed
            },
          },
        );
        const result = await res.data;

        setCamImg(resulimg);
        onCaptureOut({
          src: result?.file_upload_url,
          field_name: attributes?.field_name ?? '',
          qrData: '',
        });
        if (res?.status === 200) {
          useLogs.add(
            Date.now(),
            "Image Upload",
            "Image Upload Successful",
            result,
            undefined,
            Date.now()
          );
        }
        return result?.file_upload_url;

      } catch (error: any) {
        const status = (error)?.response?.status ?? (error)?.status ?? error?.message ?? error?.code;
        initToaster('FAILURE', `Image upload failed (${status})`);
        setCamImg('');
        onCaptureOut({
          src: '',
          field_name: '',
          qrData: ''
        });
        console.error('Error uploading image:', error);
        useLogs.add(
          Date.now(),
          "Image Upload",
          "Image Upload Failed",
          error,
          undefined,
          Date.now(),
        );
      }
    }
  }

  const uriToBlob = async (uri: any) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  async function onImageDelete() {
    try {
      const res = await AxiosClient.request().delete(is_media_service_enabled ? ApiRoutes.imgMediserdelete : ApiRoutes.imgDelete, {
        params: {
          file_url: attributes?.src ?? '',
        },
      });
      setOpenCamera(false);
      setConfirmationDialogData(null)
      onCameraOut({
        src: '',
        field_name: '',
      });
    } catch (error) {
      onCameraOut({
        src: '',
        field_name: '',
      });
      setConfirmationDialogData(null)
      console.error('Error uploading image:', error);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCamImg("retry");

      const formData = new FormData();
      const imageBlob = await uriToBlob(result?.assets?.[0]?.uri);
      formData.append('file', imageBlob, await getUploadFileName(attributes?.imgName ?? Math.floor(Date.now() / 1000).toString(), result.assets[0].uri));

      useLogs.add(
        Date.now(),
        "Image Upload",
        "Image Upload started",
        {},
        Date.now(),
      );
      await uploadImage(formData, await getUploadFileName(attributes?.imgName ?? Math.floor(Date.now() / 1000).toString(), result.assets[0].uri), result.assets[0].uri);
    }
  }

  useEffect(() => {
    setCamImg(attributes?.src);
    if (attributes?.src || attributes?.value) {
      setValue(attributes?.value as string);

      onCaptureOut({
        src: attributes?.src as string,
        field_name: attributes?.field_name ?? '',
        qrData: ''
      });

      onInputOut({
        value: (attributes?.value as string),
        field_name: attributes?.field_name ?? '',
      });
    }
  }, [attributes?.src, attributes?.value]);

  function handleDialogSubmit() {
    onImageDelete()
  }
  const getImageSource = () => {
    if (camImg === 'retry') {
      return require('@assets/images/loader.gif');
    }
    else if (camImg === 'N/A') {
      return require('@assets/images/broken_img.png');
    }
    else {
      return { uri: camImg };
    }
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: Platform.OS === 'web' ? 10 : 15,
        width: '100%',
      }}
    >
      <View
        style={{
          flex: 0.99
        }}
      >
        <FactoryInput
          attributes={{
            inputType: attributes?.inputType,
            uppercase: attributes?.uppercase,
            is_negative: attributes?.is_negative,
            regex: attributes?.regex,
            maxlength: attributes?.maxlength,
            place_holder: attributes?.place_holder,
            value: getValue,
            is_editable: attributes?.is_editable,
            isCopy: attributes?.isCopy,
          }}
          onInputOut={(data) => {
            onInputOut({
              value: data?.value as string,
              field_name: attributes?.field_name ?? '',
            });

            setValue(data?.value as string);
          }}
          style={{ background: style?.background, border: style?.border, borderWidth: style?.borderWidth, textColor: style?.textColor }}
        />
        {(openCamera && (workAround || !workAround)) && (
          <CameraPage
            imgName={attributes?.imgName ?? ''}
            OCREnabled={attributes?.OCREnabled}
            multi={attributes?.multi as boolean}
            onCameraOut={onCameraOut}
            closeCamera={() => { setOpenCamera(false) }}
            scanQR={attributes?.isQRScanner}
            tigger={workAround}
          />
        )}
      </View>

      {/* <View
        style={{
          width: '10%',
        }}
      > */}
      {!camImg || attributes?.isQRScanner ? (
        <TouchableOpacity
          style={{
            height: 40,
            width: 40,
            paddingBottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 7,
            backgroundColor: SurveyType === "multiPage" ? colors.primary_light : "#F9F9F90F",
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 9,
            elevation: 9,
          }}
          onPress={() => {
            setOpenCameraTrue()
            if (attributes?.OCREnabled && Platform.OS !== 'web') {
              useLogs.add(
                Date.now(),
                "Seal Capture Start",
                "Seal Capture started",
                {},
                Date.now(),
              );
            }
          }}
        >
          <SvgXml
            onError={(e) => console.error('error rendering svg image', e)}
            id="1"
            style={{
              width: Platform.OS === 'web' ? 32 : 20,
              height: Platform.OS === 'web' ? 32 : 20,
            }}
            xml={attributes?.isQRScanner ? qrCodeIcon : SurveyType === "multiPage" ? dummyImage : captureWhite}
          />
        </TouchableOpacity>
      ) : (
        <View style={{ position: 'relative' }}>
          {!isPropEmpty(previewUri) && (
            <ImagePreview
              closeModal={() => setPreviewUri(null)}
              imageUri={previewUri as string}
            />
          )}

          <TouchableOpacity onPress={() => setPreviewUri(camImg)}>
            <Image
              resizeMode="contain"
              style={{ width: 50, height: 50 }}
              defaultSource={require('@assets/images/broken_img.png')}
              source={getImageSource()}
            />
          </TouchableOpacity>
          {attributes?.isImageEditable &&
            <TouchableOpacity
              style={{
                width: 20,
                height: 20,
                borderRadius: 50,
                backgroundColor: 'red',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                top: -5,
                right: -23,
              }}
              onPress={() => {
                setConfirmationDialogData({
                  form: "DelSurveyData",
                  header: 'Confirmation Message',
                  backButtonText: 'Cancel',
                  submitButtontext: 'Ok',
                  bodyValue: 'Are you sure you want to delete the Image ?',
                  isAnyicon: false,
                  iconsrc: '',
                  sharedValue: ""
                })
              }}
            >
              <AntDesign name="delete" size={12} color="white" />
            </TouchableOpacity>
          }
        </View>
      )}
      {/* </View> */}
      {!isPropEmpty(ConfirmationDialogData) && (
        <ConfirmationDialog
          closeModal={() => setConfirmationDialogData(null)}
          value={ConfirmationDialogData}
          submitClicked={handleDialogSubmit}
        />
      )}
    </View>
  );
}
function FactoryDropdownCapture({
  attributes,
  onOptionsOut,
  onCaptureOut,
  initialValue,

}: {
  onOptionsOut?: (
    arg: FactoryFieldOutPut<FieldType.OPTION> | undefined,
  ) => void | undefined;
  attributes: Omit<Field<null>, 'sub_fields'> & {
    multi?: boolean;
    src?: string;
    inputType?: 'number' | 'name' | 'float';
    is_negative?: boolean;
    OCREnabled?: boolean;
    isQRScanner?: boolean,
    imgName?: string;
    sub_fields: any
  };
  initialValue?: number;
  onCaptureOut: (
    arg: FactoryFieldOutPut<FieldType.DROPDOWN_CAPTURE> | undefined,
  ) => void | undefined;
}) {
  const [openCamera, setOpenCamera] = useState<boolean>(false);
  const [camImg, setCamImg] = useState<string>();
  const [getValue, setValue] = useState<string>("");
  const [previewUri, setPreviewUri] = useState<string | null>();
  const { hasPermission } = useRoleCheck();
  const is_media_service_enabled = hasPermission(GateFeatureAccessibleRoles.MEDIA_SERVICE_ENABLED);
  const [ConfirmationDialogData, setConfirmationDialogData] =
  useState<ConfirmationDialogData | null>();
  const { initToaster } = useToaster();
  function onCameraOut(data: any) {
    setOpenCamera(false);
    onCaptureOut(data);
  }

  async function uploadImage(formData: FormData, filename: string, resulimg: any) {
    if (!attributes?.isQRScanner) {
      try {
        if (is_media_service_enabled) {
          const newPayload = {
            app_name: "ATGATE",
            module_name: "SURVEY_APP",
            folder_path: "survey",
          };

          formData.append("payload", JSON.stringify(newPayload));
        }
        const res = await AxiosClient.request().post(
          is_media_service_enabled ? ApiRoutes.imgMediserUpload : ApiRoutes.imgUpload,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            params: {
              filename: filename, // Pass fileName as param if needed
            },
          },
        );
        const result = await res.data;
        if (res?.status === 200) {
          useLogs.add(
            Date.now(),
            "Image Upload",
            "Image Upload Successful",
            result,
            undefined,
            Date.now()
          );
        }
        setCamImg(resulimg);
        onCaptureOut({
          src: result?.file_upload_url,
          field_name: attributes?.field_name ?? '',
          qrData: '',
        });
        return result?.file_upload_url;
      } catch (error: any) {
        const status = (error)?.response?.status ?? (error)?.status ?? error?.message ?? error?.code;
        initToaster('FAILURE', `Image upload failed (${status})`);
        setCamImg('');
        onCaptureOut({
          src: '',
          field_name: '',
          qrData: ''
        });
        useLogs.add(
          Date.now(),
          "Image Upload",
          "Image Upload Failed",
          error,
          undefined,
          Date.now(),
        );
      }
    }
  }

  const uriToBlob = async (uri: any) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  async function onImageDelete() {
    try {
      const res = await AxiosClient.request().delete(is_media_service_enabled ? ApiRoutes.imgMediserdelete : ApiRoutes.imgDelete, {
        params: {
          file_url: attributes?.src ?? '',
        },
      });
      setOpenCamera(false);
      setConfirmationDialogData(null)
      onCameraOut({
        src: '',
        field_name: '',
      });
    } catch (error) {
      onCameraOut({
        src: '',
        field_name: '',
      });
      setConfirmationDialogData(null)
      console.error('Error uploading image:', error);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCamImg("retry");

      const formData = new FormData();
      const imageBlob = await uriToBlob(result?.assets?.[0]?.uri);
      formData.append("file", imageBlob, await getUploadFileName(attributes?.imgName ?? Math.floor(Date.now() / 1000).toString(), result.assets[0].uri));
      useLogs.add(
        Date.now(),
        "Image Upload",
        "Image Upload started",
        {},
        Date.now(),
      );
      await uploadImage(formData, await getUploadFileName(attributes?.imgName ?? Math.floor(Date.now() / 1000).toString(), result.assets[0].uri), result.assets[0].uri);
    }
  }


  useEffect(() => {
    setCamImg(attributes?.src);
    if (attributes?.src || attributes?.value) {
      setValue(attributes?.value as string);

      onCaptureOut({
        src: attributes?.src as string,
        field_name: attributes?.field_name ?? "",
        qrData: "",
      });

    }
  }, [attributes?.src, attributes?.value]);

  useEffect(() => {
    if (attributes?.src) {
      setCamImg(attributes.src);
    }
  }, []);
  function handleDialogSubmit() {
    onImageDelete();
  }
  const getImageSource = () => {
    if (camImg === "retry") {
      return require("@assets/images/loader.gif");
    }
    else if (camImg === "N/A") {
      return require("@assets/images/broken_img.png");
    }
    return { uri: camImg };
  };


  return (
    <View
      style={{
        flexDirection: "row",
        gap: Platform.OS === "web" ? 5 : 15,
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          flex: 0.99,
        }}
      >
        <DropdownComponent
          onValueOut={(d) => {
            const out: any = {
              value: d.value,
              field_name: attributes?.field_name ?? '',
            };

            if (onOptionsOut) onOptionsOut(out);
          }}
          placeHolder={attributes?.place_holder ?? ''}
          label={attributes?.display_name ?? ''}
          data={attributes?.sub_fields ?? []}
          initialVal={initialValue} isEditable={true}        ></DropdownComponent>
        {openCamera && (
          <CameraPage
            imgName={attributes?.imgName ?? ""}
            OCREnabled={attributes?.OCREnabled}
            multi={attributes?.multi as boolean}
            onCameraOut={onCameraOut}
            closeCamera={() => { setOpenCamera(false) }}
            scanQR={attributes?.isQRScanner}
          />
        )}
      </View>
      {!camImg || attributes?.isQRScanner ? (
        <TouchableOpacity
          style={{
            height: 40,
            width: 40,
            paddingBottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 7,
            backgroundColor: SurveyType === "multiPage" ? colors.primary_light : "#F9F9F90F",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 9,
            elevation: 9,
          }}
          onPress={() => {
            Platform.OS === "web" ? pickImage() : setOpenCamera(true);
          }}
        >
          <SvgXml
            onError={(e) => console.error("error rendering svg image", e)}
            id="1"
            style={{
              width: Platform.OS === "web" ? 32 : 20,
              height: Platform.OS === "web" ? 32 : 20,
            }}
            xml={attributes?.isQRScanner ? qrCodeIcon : SurveyType === "multiPage" ? dummyImage : captureWhite}
          />
        </TouchableOpacity>
      ) : (
        <View style={{ position: "relative" }}>
          {!isPropEmpty(previewUri) && (
            <ImagePreview
              closeModal={() => setPreviewUri(null)}
              imageUri={previewUri as string}
            />
          )}

          <TouchableOpacity onPress={() => setPreviewUri(camImg)}>
            <Image
              resizeMode="contain"
              style={{ width: 40, height: 40 }}
              defaultSource={require("@assets/images/broken_img.png")}
              source={getImageSource()}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 20,
              height: 20,
              borderRadius: 50,
              backgroundColor: "red",
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              top: -5,
              right: -23,
            }}
            onPress={() => {
              setConfirmationDialogData({
                form: "DelSurveyData",
                header: "Confirmation Message",
                backButtonText: "Cancel",
                submitButtontext: "Ok",
                bodyValue: "Are you sure you want to delete the Image ?",
                isAnyicon: false,
                iconsrc: "",
                sharedValue: "",
              });
            }}
          >
            <AntDesign name="delete" size={12} color="white" />
          </TouchableOpacity>
        </View>
      )}
      {!isPropEmpty(ConfirmationDialogData) && (
        <ConfirmationDialog
          closeModal={() => setConfirmationDialogData(null)}
          value={ConfirmationDialogData}
          submitClicked={handleDialogSubmit}
        />
      )}
    </View>
  );
}
function FactoryToggleSwitch({ initialvalue, enabled, onToggleout }: { initialvalue?: boolean, enabled?: boolean, onToggleout: (arg: boolean) => void | undefined }) {
  const [isOn, setIsOn] = useState(false);
  useEffect(() => {
    setIsOn(initialvalue ?? false);
    if (initialvalue) {
      onToggleout(initialvalue);
    }
  }, [initialvalue]);
  const handleToggle = () => {
    if (!enabled) return;
    const newState = !isOn;
    setIsOn(newState);
    onToggleout(newState);
  };
  return (
    <SwitchToggle
      switchOn={isOn}
      onPress={handleToggle}
      circleColorOff="#3c3c3c"
      circleColorOn="#F9F9F9"
      backgroundColorOn="#7ecc29"
      backgroundColorOff="#bababa"
      containerStyle={{
        width: 32,
        height: 18,
        borderRadius: 25,
        padding: 2,
      }}
      circleStyle={{
        width: 14,
        height: 14,
        borderRadius: 15,
        left: Platform.OS === 'web' ? 0 : -4.5,
      }}
    />
  );
}
interface FactoryDateTimePickerProps {
  attributes: Omit<Field<null>, 'sub_fields'> & {
    mode?: DateTimeMode;
    dateFormat?: string; // e.g., 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
    timeFormat?: '12h' | '24h';
    maxDate?: Date;

  };
  onInputOut?: (
    arg: FactoryFieldOutPut<FieldType.DATETIME> | undefined,
  ) => void | undefined;
  onFocus?: () => void;
  style?: { background?: string, border?: string, borderWidth?: number, textColor?: string }

}

function FactoryDateTimePicker({
  attributes,
  onInputOut,
  onFocus,
  style,
}: FactoryDateTimePickerProps) {
  const [inputDate, setInputDate] = useState<Date | null>(null);

  // initialize from attributes.value
  useEffect(() => {
    if (attributes.value) {
      const parsed = new Date(attributes.value);
      if (!isNaN(parsed.getTime())) {
        setInputDate(parsed);
        onInputOut?.({
          value: parsed.getTime(),
          field_name: attributes.field_name ?? '',
        });
      }
    }
  }, [attributes.value]);

  return (
    <View style={{ width: '100%' }}>
      <DatePickerInput
        mode="outlined"
        locale="en-IN"
        label={undefined}
        animationType='fade'
        withDateFormatInLabel={false}
        placeholder='DD/MM/YYYY'
        placeholderTextColor={colors?.primary_placeholder_light}
        textColor={style?.textColor ?? colors.text_primary_dark}
        value={inputDate ?? undefined}
        onChange={(d: any) => {
          setInputDate(d);
          onInputOut?.({
            value: d ? d.getTime() : null,
            field_name: attributes.field_name ?? '',
          });
        }}
        keyboardType='numeric'
        inputMode="start"
        disabled={attributes.is_editable === false}
        endYear={new Date().getFullYear()}
        onFocus={onFocus}
        style={{
          height: 45,
          fontSize: 16,
          backgroundColor: 'transparent',
          borderColor: style?.border ?? '#ccc',
          borderWidth: 1.5,
          borderRadius: 5,
          color: style?.textColor,
        }}
        theme={{
          colors: {
            primary: style?.border ?? '#ccc',      // active outline color (focused)
            outline: style?.border ?? '#ccc',      // default outline color (unfocused)
          }
        }}
        validRange={{
          endDate: attributes?.maxDate ?? new Date(),   // 👈 sets max date as today
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  copyIcon: {
    height: 40,
    width: 40,
    paddingBottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: SurveyType === 'multiPage' ? colors.primary_light : '#F9F9F90F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 9,
    elevation: 9,
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    flexGrow: 1,
  }
})

export {
  FactoryInput,
  FactoryCheckBox,
  FactoryRadioGroup,
  FactoryOptions,
  FactoryCapture,
  FactoryInputCapture,
  FactoryToggleSwitch,
  FactoryTextArea,
  FactoryDropdownCapture,
  FactoryDateTimePicker
};
