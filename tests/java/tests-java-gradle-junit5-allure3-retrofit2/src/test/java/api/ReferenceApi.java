package api;

import api.model.AuthResponse;
import api.model.HealthResponse;
import api.model.ItemsResponse;
import api.model.LoginRequest;
import api.model.ProfileResponse;
import api.model.RegisterRequest;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;

/**
 * Retrofit 2 surface of the teaching {@code /api} contract.
 */
public interface ReferenceApi {

    @POST("api/auth/login")
    Call<AuthResponse> login(@Body LoginRequest body);

    @POST("api/auth/login")
    Call<AuthResponse> loginRaw(@Body RequestBody body);

    @POST("api/auth/register")
    Call<AuthResponse> register(@Body RegisterRequest body);

    @POST("api/auth/register")
    Call<AuthResponse> registerRaw(@Body RequestBody body);

    @GET("api/auth/me")
    Call<ProfileResponse> me();

    @GET("api/auth/me")
    Call<ProfileResponse> me(@Header("Authorization") String authorization);

    @POST("api/auth/logout")
    Call<Void> logout();

    @POST("api/auth/logout")
    Call<Void> logout(@Header("Authorization") String authorization);

    @DELETE("api/auth/me")
    Call<Void> deleteMe();

    @DELETE("api/auth/me")
    Call<Void> deleteMe(@Header("Authorization") String authorization);

    @GET("api/health")
    Call<HealthResponse> health();

    @GET("api/items")
    Call<ItemsResponse> items();

    @GET("api/nope")
    Call<Void> unmapped();
}
